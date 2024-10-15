import {useEffect} from "react";

export function useKey(key,action ) {
    useEffect(() => {
        function callBack(e) {


            if (e.key.toLowerCase() === key.toLowerCase()) {
                action();
            }
        }

        document.addEventListener('keydown', callBack);
        return()=>document.removeEventListener('keydown',callBack)


    }, [action, key]);
}