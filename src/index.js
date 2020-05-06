const path = require("path")
const lib = require("./lib/lib")

//eslint-disable-next-line
const CWD = __dirname

const publicPath = path.join(CWD, "../public")
const postsPath = path.join(CWD, "../posts")

const head = lib.getHtmlComponent(path.join(CWD, "./components/head.html"))
const header = lib.getHtmlComponent(path.join(CWD, "./components/header.html"))
const footer = lib.getHtmlComponent(path.join(CWD, "./components/footer.html"))
const index = lib.getHtmlComponent(path.join(CWD, "./components/index.html"))

async function main() {
    lib.preparePublicDirectory(publicPath)

    // read all markdown posts
    const posts = await lib.getPosts(postsPath)

    // process index page
    const indexPath = path.join(publicPath, "./index.html")
    const indexPage = lib.getIndexPage(head, index, header, posts)
    lib.writePage(indexPath, indexPage)

    // process blog post pages
    for (const post of posts) {
        const pagePath = path.join(publicPath, "./posts", post.filename)
        const postPage = await lib.getPostPage(head, post.title, post.content, header, footer)
        lib.writePage(pagePath, postPage)
    }

    // process styles
    const globalStylePath = path.join(CWD, "./styles/global.scss")
    const globalCss = lib.processCss(globalStylePath)
    const globalStyleOutputPath = path.join(CWD, "../public/styles/global.css")
    lib.writePage(globalStyleOutputPath, globalCss.css)

    // TODO: copy all img and styles to public dir
    // TODO: use prettier to format outgoing html files
}

main()
