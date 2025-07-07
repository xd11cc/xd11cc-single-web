// 1、存储数据
export const setItem = (key, value) => {
    if (typeof value === 'object') {
        value = JSON.stringify(value)
    }
    window.localStorage.setItem(key, value)
}
// 2、获取数据
export const getItem = key =>{
    const data = window.localStorage.getItem(key);
    try {
        return JSON.parse(data)
    }catch(error) {
        return data;
    }
}
// 3、删除指定数据
export const removeItem = key =>{
    window.localStorage.removeItem(key)
}
// 4、删除所有数据
export const removeAllItem = () =>{
    window.localStorage.clear()
}