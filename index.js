const http = require("http");


function removeTrailingSlash(pathname) {
    return pathname.replace(/\/+$/, "");
}

const dictionary = new Map();

const server = http.createServer((req, res) => {
    const url = new URL(`http://${process.env.HOST ?? 'localhost'}${req.url}`);
    const params = url.searchParams;
    const pathname = removeTrailingSlash(url.pathname);

    if (pathname === "/api/definitions" && req.method === "POST") {
        console.log(`Inside ${req.url} ${req.method}`); ///////////// DEBUGGING
        let body = [];
        req
            .on('error', err => {
                console.error(err);
            })
            .on('data', chunk => {
                body.push(chunk);
            })
            .on('end', () => {
                body = Buffer.concat(body).toString();
                // BEGINNING OF NEW STUFF
                res.on('error', err => {
                    console.error(err);
                });
                body = JSON.parse(body);
                const word = body.word;
                const definition = body.definition;

                if(!word) {
                    res.writeHead(404, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({error: "MISSING FIELD", message: "word field required"}));
                    return
                }
                if(!definition) {
                    res.writeHead(404, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({error: "MISSING FIELD", message: "definition field required"}));
                    return
                }
                if(dictionary.has(word)) {
                    res.writeHead(404, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({error: "ALREADY EXIST", message: `${word} already exist in the dictionary`}));
                    return
                }

                dictionary.set(word, definition);
                res.end(JSON.stringify({message: "word successfully stored in the dictionary"}));
                console.log(`${word}: ${definition}`); ///////////////////// DEbuGGING
            });

    } else if (pathname === "/api/definitions" && req.method === "GET") {
        const word = params.get("word");
        const definition = dictionary.get(word);

        console.log(`${word}: ${definition}`) /////////////////////////// DEBUGGING

        if(!definition) {
            res.writeHead(404, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: "NOT FOUND", message: `definition not found`}));
            return;
        }
        res.end(JSON.stringify({"definition": definition}));    
    } else {
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: "NOT FOUND", message: "api path not found"}));
    }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
