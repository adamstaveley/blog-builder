# Simple blog builder

Inspired by the [Next.js](https://nextjs.org/) tutorial, a static blog site can be generated using markdown files.

Running the builder will convert the markdown files in `./posts` to HTML and build the static files in `./public`:
```
npm start
```

Note that this uses Python 3's `http.server` to serve the static files.