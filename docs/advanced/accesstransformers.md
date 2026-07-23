import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 访问转换器 {#access-transformers}

访问转换器（Access Transformer，简称 AT）用于放宽类、方法和字段的可见性，并修改它们的 `final` 标志。借助它们，Mod 开发者可以访问并修改那些位于自己无法控制的类中、原本无法访问的成员。

可以在 NeoForged GitHub 上查看[规范文档][specs]。

## 添加 AT {#adding-ats}

向 Mod 项目添加访问转换器非常简单，只需在 `build.gradle` 中加入一行即可：

访问转换器需要在 `build.gradle` 中声明。AT 文件可以放在任意位置，只要它在编译时会被复制到 `resources` 输出目录即可。

<Tabs defaultValue="mdg">
<TabItem value="mdg" label="ModDevGradle">

默认情况下这里无需做任何事情！

</TabItem>
<TabItem value="ng" label="NeoGradle">

```gradle
// In build.gradle:
minecraft {
    accessTransformers {
        file 'src/main/resources/META-INF/accesstransformer.cfg'
    }
}
```

</TabItem>
</Tabs>

默认情况下，NeoForge 会查找 `META-INF/accesstransformer.cfg`。如果 `build.gradle` 将访问转换器指定在其他任意位置，则需要在 `neoforge.mods.toml` 中定义它们的位置：

```toml
# In neoforge.mods.toml:
[[accessTransformers]]
## The file is relative to the output directory of the resources, or the root path inside the jar when compiled
## The 'resources' directory represents the root output directory of the resources
file="META-INF/accesstransformer.cfg"
```

此外，可以指定多个 AT 文件，它们会按顺序应用。这对于包含多个包的大型 Mod 很有用。

<Tabs defaultValue="mdg">
<TabItem value="mdg" label="ModDevGradle">

```gradle
// In build.gradle:
neoForge {
    // ModDevGradle already tries to include 'src/main/resources/META-INF/accesstransformer.cfg' by default
    accessTransformers.from 'src/additions/resources/accesstransformer_additions.cfg'
}
```

</TabItem>
<TabItem value="ng" label="NeoGradle">

```gradle
// In build.gradle:
minecraft {
    accessTransformers {
        file 'src/main/resources/META-INF/accesstransformer.cfg'
        file 'src/additions/resources/accesstransformer_additions.cfg'
    }
}
```

</TabItem>
</Tabs>

```toml
# In neoforge.mods.toml
[[accessTransformers]]
file="accesstransformer.cfg"

[[accessTransformers]]
file="accesstransformer_additions.cfg"
```

添加或修改任何访问转换器后，必须刷新 Gradle 项目，转换才会生效。

## 访问转换器规范 {#the-access-transformer-specification}

### 注释 {#comments}

`#` 之后直到行尾的所有文本都会被视为注释，不会被解析。

### 访问修饰符 {#access-modifiers}

访问修饰符指定给定目标将被转换成的新成员可见性。按可见性从高到低排列：

- `public` - 对包内外的所有类可见
- `protected` - 仅对包内的类和子类可见
- `default` - 仅对包内的类可见
- `private` - 仅对类内部可见

可以在上述修饰符后追加特殊修饰符 `+f` 和 `-f`，分别用于添加或移除 `final` 修饰符。应用 `final` 修饰符会阻止子类化、方法重写或字段修改。

:::danger
指令只会修改它直接引用的方法；任何重写方法都不会被访问转换。建议确保被转换的方法不存在限制可见性的、未被转换的重写方法，否则会导致 JVM 抛出错误。

可以安全转换的方法示例包括 `final` 方法（或 `final` 类中的方法）以及 `static` 方法。`private` 方法通常也是安全的；不过它们可能在任何子类型中造成意外的重写，因此应当进行一些额外的手动验证。
:::

### 目标与指令 {#targets-and-directives}

#### 类 {#classes}

针对类：

```
<access modifier> <fully qualified class name>
```

内部类的表示方法是：将外部类的完全限定名与内部类的名称用 `$` 分隔符组合起来。

#### 字段 {#fields}

针对字段：

```
<access modifier> <fully qualified class name> <field name>
```

#### 方法 {#methods}

针对方法需要一种特殊语法来表示方法参数和返回类型：

```
<access modifier> <fully qualified class name> <method name>(<parameter types>)<return type>
```

##### 指定类型 {#specifying-types}

这些类型也称为“描述符”：更多技术细节参见 [Java 虚拟机规范，SE 21，4.3.2 和 4.3.3 节][jvmdescriptors]。

- `B` - `byte`，有符号字节
- `C` - `char`，以 UTF-16 表示的 Unicode 字符码点
- `D` - `double`，双精度浮点值
- `F` - `float`，单精度浮点值
- `I` - `integer`，32 位整数
- `J` - `long`，64 位整数
- `S` - `short`，有符号短整型
- `Z` - `boolean`，`true` 或 `false` 值
- `[` - 表示数组的一个维度
    - 示例：`[[S` 表示 `short[][]`
- `L<class name>;` - 表示引用类型
    - 示例：`Ljava/lang/String;` 表示 `java.lang.String` 引用类型 _（注意此处使用斜杠而非句点）_
- `(` - 表示方法描述符，参数应在此提供；若无参数则留空
    - 示例：`<method>(I)Z` 表示一个需要整数参数并返回布尔值的方法
- `V` - 表示方法不返回任何值，只能用于方法描述符的末尾
    - 示例：`<method>()V` 表示一个无参数且无返回值的方法

### 示例 {#examples}

```
# Makes public the ByteArrayToKeyFunction interface in Crypt
public net.minecraft.util.Crypt$ByteArrayToKeyFunction

# Makes protected and removes the final modifier from 'random' in MinecraftServer
protected-f net.minecraft.server.MinecraftServer random

# Makes public the 'makeExecutor' method in Util,
# accepting a String and returns a TracingExecutor
public net.minecraft.Util makeExecutor(Ljava/lang/String;)Lnet/minecraft/TracingExecutor;

# Makes public the 'leastMostToIntArray' method in UUIDUtil,
# accepting two longs and returning an int[]
public net.minecraft.core.UUIDUtil leastMostToIntArray(JJ)[I
```

[specs]: https://github.com/NeoForged/AccessTransformers/blob/main/FMLAT.md
[jvmdescriptors]: https://docs.oracle.com/javase/specs/jvms/se25/html/jvms-4.html#jvms-4.3.2
