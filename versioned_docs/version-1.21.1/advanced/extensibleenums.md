# 可扩展枚举 {#extensible-enums}

可扩展枚举（Extensible Enum）是对特定原版枚举的增强，允许向其中添加新条目。它通过在运行时修改枚举的已编译字节码来添加元素。

## `IExtensibleEnum` {#iextensibleenum}

所有可以添加新条目的枚举都实现了 `IExtensibleEnum` 接口。该接口充当标记，让 `RuntimeEnumExtender` 启动插件服务知道哪些枚举需要被转换。

:::warning
你**不应**在自己的枚举上实现该接口。请根据用例改用映射（map）或注册表。
未被补丁修改以实现该接口的枚举，由于转换器的运行顺序，无法通过 Mixin 或 coremod 为其添加该接口。
:::

### 创建枚举条目 {#creating-an-enum-entry}

要创建新的枚举条目，需要创建一个 JSON 文件，并在 `neoforge.mods.toml` 中通过 `[[mods]]` 块的 `enumExtensions` 条目引用它。所指定的路径必须相对于 `resources` 目录：
```toml
# In neoforge.mods.toml:
[[mods]]
## The file is relative to the output directory of the resources, or the root path inside the jar when compiled
## The 'resources' directory represents the root output directory of the resources
enumExtensions="META-INF/enumextensions.json"
```

条目的定义由以下内容组成：目标枚举的类名、新字段的名称（必须以 mod id 为前缀）、用于构造该条目的构造器描述符，以及要传给该构造器的参数。

```json5
{
    "entries": [
        {
            // The enum class the entry should be added to
            "enum": "net/minecraft/world/item/ItemDisplayContext",
            // The field name of the new entry, must be prefixed with the mod ID
            "name": "EXAMPLEMOD_STANDING",
            // The constructor to be used
            "constructor": "(ILjava/lang/String;Ljava/lang/String;)V",
            // Constant parameters provided directly.
            "parameters": [ -1, "examplemod:standing", null ]
        },
        {
            "enum": "net/minecraft/world/item/Rarity",
            "name": "EXAMPLEMOD_CUSTOM",
            "constructor": "(ILjava/lang/String;Ljava/util/function/UnaryOperator;)V",
            // The parameters to be used, provided as a reference to an EnumProxy<Rarity> field in the given class
            "parameters": {
                "class": "example/examplemod/MyEnumParams",
                "field": "CUSTOM_RARITY_ENUM_PROXY"
            }
        },
        {
            "enum": "net/minecraft/world/damagesource/DamageEffects",
            "name": "EXAMPLEMOD_TEST",
            "constructor": "(Ljava/lang/String;Ljava/util/function/Supplier;)V",
            // The parameters to be used, provided as a reference to a method in the given class
            "parameters": {
                "class": "example/examplemod/MyEnumParams",
                "method": "getTestDamageEffectsParameter"
            }
        }
    ]
}
```

```java
public class MyEnumParams {
    public static final EnumProxy<Rarity> CUSTOM_RARITY_ENUM_PROXY = new EnumProxy<>(
            Rarity.class, -1, "examplemod:custom", (UnaryOperator<Style>) style -> style.withItalic(true)
    );
    
    public static Object getTestDamageEffectsParameter(int idx, Class<?> type) {
        return type.cast(switch (idx) {
            case 0 -> "examplemod:test";
            case 1 -> (Supplier<SoundEvent>) () -> SoundEvents.DONKEY_ANGRY;
            default -> throw new IllegalArgumentException("Unexpected parameter index: " + idx);
        });
    }
}
```

#### 构造器 {#constructor}

构造器必须以[方法描述符][jvmdescriptors]的形式指定，并且只能包含源代码中可见的参数，省略隐藏的常量名称参数和序号参数。
如果某个构造器被标注了 `@ReservedConstructor` 注解，则它不能用于 Mod 添加的枚举常量。

#### 参数 {#parameters}

参数可以通过三种方式指定，具体限制取决于参数类型：

- 以常量数组的形式内联写在 JSON 文件中（仅允许用于基本类型值、字符串，以及向任意引用类型传入 null）
- 作为对 Mod 中某个类内 `EnumProxy<TheEnum>` 类型字段的引用（参见上文 `EnumProxy` 示例）
    - 第一个参数指定目标枚举，其余参数则是要传给枚举构造器的参数
- 作为对某个返回 `Object` 的方法的引用，其返回值即为要使用的参数值。该方法必须恰好有两个参数，类型分别为 `int`（参数的索引）和 `Class<?>`（参数的预期类型）
    - 应使用该 `Class<?>` 对象对返回值进行强制转换（`Class#cast()`），以便把 `ClassCastException` 保留在 Mod 代码中。

:::warning
用作参数值来源的字段和/或方法应放在单独的类中，以避免过早地意外加载 Mod 的类。
:::

某些参数还有额外规则：

- 如果某参数是与枚举上 `@IndexedEnum` 注解相关的 int ID 参数，则该参数会被忽略并替换为该条目的序号。若该参数在 JSON 中以内联方式指定，则必须写成 `-1`，否则会抛出异常。
- 如果某参数是与枚举上 `@NamedEnum` 注解相关的 String 名称参数，则它必须以 mod id 为前缀，采用 `ResourceLocation` 中熟知的 `namespace:path` 格式，否则会抛出异常。

#### 获取生成的常量 {#retrieving-the-generated-constant}

可以通过 `TheEnum.valueOf(String)` 获取生成的枚举常量。如果使用字段引用来提供参数，那么也可以通过 `EnumProxy` 对象的 `EnumProxy#getValue()` 获取该常量。

## 向 NeoForge 贡献 {#contributing-to-neoforge}

要向 NeoForge 添加一个新的可扩展枚举，至少需要做以下两件事：

- 让该枚举实现 `IExtensibleEnum`，以标记该枚举应通过 `RuntimeEnumExtender` 进行转换。
- 添加一个 `getExtensionInfo` 方法，返回 `ExtensionInfo.nonExtended(TheEnum.class)`。

根据枚举的具体细节，可能还需要进一步操作：

- 如果该枚举有一个应与条目序号匹配的 int ID 参数，则应为其标注 `@NumberedEnum`；若该 ID 参数不是第一个参数，则将其参数索引作为注解的值
- 如果该枚举有一个用于序列化、因而应带命名空间的 String 名称参数，则应为其标注 `@NamedEnum`；若该名称参数不是第一个参数，则将其参数索引作为注解的值
- 如果该枚举会通过网络发送，则应为其标注 `@NetworkedEnum`，并用注解的参数指定值可以在哪个方向上发送（发往客户端、发往服务端或双向）
    - 警告：一旦 NeoForge 实现了针对枚举的网络校验，网络化枚举将需要额外的步骤
- 如果该枚举包含 Mod 无法使用的构造器（例如它们需要注册表对象，而该枚举可能在 Mod 注册运行之前就已初始化），则应为其标注 `@ReservedConstructor`

:::note
如果某枚举实际上被添加了任何条目，`getExtensionInfo` 方法会在运行时被转换，以提供一个动态生成的 `ExtensionInfo`。
:::

```java
// This is an example, not an actual enum within 原版
public enum ExampleEnum implements net.neoforged.fml.common.asm.enumextension.IExtensibleEnum {
    // VALUE_1 represents the name parameter here
    VALUE_1(0, "value_1", false),
    VALUE_2(1, "value_2", true),
    VALUE_3(2, "value_3");

    ExampleEnum(int arg1, String arg2, boolean arg3) {
        // ...
    }

    ExampleEnum(int arg1, String arg2) {
        this(arg1, arg2, false);
    }

    public static net.neoforged.fml.common.asm.enumextension.ExtensionInfo getExtensionInfo() {
        return net.neoforged.fml.common.asm.enumextension.ExtensionInfo.nonExtended(ExampleEnum.class);
    }
}
```

[jvmdescriptors]: https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-4.html#jvms-4.3.2
