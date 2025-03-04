const fs = require("fs")
const path = require("path")
const lib = require("./lib/lib")

//eslint-disable-next-line
const CWD = __dirname

const PUBLIC_PATH = path.join(CWD, "../public")
const POSTS_PATH = path.join(CWD, "../posts")
const COMPONENTS_PATH = path.join(CWD, "./components")


async function main() {
    // create root-level public directory and subdirectories
    lib.preparePublicDirectory(PUBLIC_PATH)

    // read all html components
    const components = lib.loadHtmlComponents(COMPONENTS_PATH)

    // read all markdown posts
    const posts = await lib.getBlogPosts(POSTS_PATH)

    // use the createPageBuilder closure to build all future pages
    const pageBuilder = lib.createPageBuilder({
        documentTemplate: components["document.html"],
        htmlHeadTemplate: components["html-head.html"],
        pageHeader: components["page-header.html"],
        rootTitle: "Adam Staveley"
    })

    // build and write index page
    const indexPath = path.join(PUBLIC_PATH, "./index.html")
    const indexPage = pageBuilder.buildIndexPage({
        indexTemplate: components["index.html"],
        posts
    })
    fs.writeFileSync(indexPath, indexPage)

    // build and write blog post pages
    for (const post of posts) {
        const pagePath = path.join(PUBLIC_PATH, "./posts", post.filename)
        const postPage = pageBuilder.buildPostPage({
            postTemplate: components["post.html"],
            ...post
        })
        fs.writeFileSync(pagePath, postPage)
    }

    // copy top-level resources
    const favicon = "./favicon.ico"
    const manifest = "./site.webmanifest"
    fs.copyFileSync(path.join(CWD, favicon), path.join(PUBLIC_PATH, favicon))
    fs.copyFileSync(path.join(CWD, manifest), path.join(PUBLIC_PATH, manifest))

    // copy images and scripts
    lib.copyFiles(path.join(CWD, "./img"), path.join(PUBLIC_PATH, "./img"))
    lib.copyFiles(path.join(CWD, "/scripts"), path.join(PUBLIC_PATH, "./js"))

    // copy styles (process scss and handle symlinks)
    lib.copyStyles(path.join(CWD, "./styles"), path.join(PUBLIC_PATH, "./styles"))
}

main()
