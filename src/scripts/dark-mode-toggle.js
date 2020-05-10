const isDark = () => localStorage.getItem("isDark") === "true"

const setDarkMode = (isDark) => {
    const body = document.querySelector("body")
    if (isDark) {
        body.style.backgroundColor = "black"
        body.style.color = "white"
    } else {
        body.style.backgroundColor = "white"
        body.style.color = "black"
    }
}

//eslint-disable-next-line
const toggleDarkMode = () => {
    const current = isDark()
    const next = current === true ? "false" : "true"
    localStorage.setItem("isDark", next)
    setDarkMode(next === "true")
}

setDarkMode(isDark())