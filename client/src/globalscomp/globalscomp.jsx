export const Message = (props) => {
    return(
        <div className="msg fixed top-10 mx-auto">
            <p className="text-white">{props.text}</p>
        </div>
    )
}