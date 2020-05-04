const path = require("path")
const lib = require("./lib/lib")

const head = lib.getHtmlComponent(path.join(__dirname, "./components/head.html"))
const footer = lib.getHtmlComponent(path.join(__dirname, "./components/footer.html"))
const index = lib.getHtmlComponent(path.join(__dirname, "./components/index.html"))

async function main() {
    // process index page
    const indexPath = path.join(__dirname, "../public/index.html")
    const indexPage = lib.getIndexPage({head, index})
    lib.writePage(indexPath, indexPage)

    // process blog post pages
    const postsDir = path.join(__dirname, "../posts")
    for (const post of lib.readPostsDir(postsDir)) {
        const pagePath = path.join(__dirname, "../public/posts", `${post.title}.html`)
        const postPage = await lib.getPostPage({
            head, 
            title: post.title,
            content: post.content,
            footer 
        })
        lib.writePage(pagePath, postPage)
    }

    // process styles
    const globalStylePath = path.join(__dirname, "./styles/global.scss")
    const globalCss = lib.processCss(globalStylePath)
    const globalStyleOutputPath = path.join(__dirname, "../public/styles/global.css")
    lib.writePage(globalStyleOutputPath, globalCss.css)
}

main()
