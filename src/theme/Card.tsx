import Link from "@docusaurus/Link";

export default function Card(props: any) {
    return (
        <a href={props.link} className="no-underline">
            <div
                className={
                    props.main
                        ? "card link-card link-card-main"
                        : "card link-card "
                }
            >
                <div className="card__header">
                    <h3>{props.title}</h3>
                </div>
                <div className="card__body link-card-body">
                    <p>{props.body}</p>
                </div>
                {props.link != undefined ? (
                    <div className="card__footer link-card-footer">
                        <Link
                            isNavLink={true}
                            to={props.link}
                            className="button button--secondary button--block"
                        >
                            {props.linkTitle}
                        </Link>
                    </div>
                ) : (
                    ""
                )}
                <div
                    className={props.img ? "link-card-img" : ""}
                    style={{ display: props.img ? "block" : "none" }}
                >
                    <img src={props.img} alt="" />
                </div>
            </div>
        </a>
    );
}
