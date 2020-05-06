const fs = require("fs")
const path = require("path")
const lib = require("./lib/lib")

//eslint-disable-next-line
const CWD = __dirname

const PUBLIC_PATH = path.join(CWD, "../public")
const POSTS_PATH = path.join(CWD, "../posts")
const COMPONENTS_PATH = path.join(CWD, "./components")

async function main() {
    // read all html components
    const components = lib.loadHtmlComponents(COMPONENTS_PATH)

    // create root-level public directory and subdirectories
    lib.preparePublicDirectory(PUBLIC_PATH)

    // read all markdown posts
    const posts = await lib.getBlogPosts(POSTS_PATH)

    // use the createPageBuilder closure to build future pages
    const pageBuilder = lib.createPageBuilder({
        documentTemplate: components["document.html"],
        htmlHeadTemplate: components["html-head.html"],
        pageHeader: components["page-header.html"]
    })

    // build and write index page
    const indexPath = path.join(PUBLIC_PATH, "./index.html")
    const indexPage = pageBuilder.buildIndexPage({
        title: "Adam Staveley",
        indexTemplate: components["index.html"],
        posts
    })
    fs.writeFileSync(indexPath, indexPage)

    // build and write blog post pages
    for (const post of posts) {
        const pagePath = path.join(PUBLIC_PATH, "./posts", post.filename)
        const postPage = pageBuilder.buildPostPage({
            postTemplate: components["post.html"],
            title: post.title,
            content: post.content,
            pageFooter: components["page-footer.html"]
        })
        fs.writeFileSync(pagePath, postPage)
    }

    // process styles
    const globalStylePath = path.join(CWD, "./styles/global.scss")
    const globalCss = lib.processCss(globalStylePath)
    const globalStyleOutputPath = path.join(CWD, "../public/styles/global.css")
    fs.writeFileSync(globalStyleOutputPath, globalCss.css)

    // TODO: copy all img and styles to public dir
}

main()
