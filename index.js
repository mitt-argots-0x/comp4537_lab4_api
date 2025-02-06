const http = require("http");


function removeTrailingSlash(pathname) {
    return pathname.replace(/\/+$/, "");
}

// Request Counters
const dictionary = new Map();
let totalRequests = 0;

const server = http.createServer((req, res) => {
    const url = new URL(`http://${process.env.HOST ?? 'localhost'}${req.url}`);
    const params = url.searchParams;
    const pathname = removeTrailingSlash(url.pathname);

    res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS"); // Allow specific methods
    res.setHeader("Access-Control-Allow-Headers", "Content-Type"); // Allow headers like JSON

    //Preflight Requests (OPTIONS method)
    if (req.method === "OPTIONS") {
        res.writeHead(204); // No Content response for preflight
        res.end();
        return;
    }


    // Count every incoming request
    totalRequests++;
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
                    res.end(JSON.stringify({error: "MISSING FIELD", message: "word field required", totalRequests}));
                    return
                }
                if(!definition) {
                    res.writeHead(404, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({error: "MISSING FIELD", message: "definition field required", totalRequests}));
                    return
                }
                if(dictionary.has(word)) {
                    res.writeHead(404, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({error: "ALREADY EXIST", message: `${word} already exist in the dictionary`, totalRequests}));
                    return
                }

                dictionary.set(word, definition);
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({success: true, message: "word successfully stored in the dictionary", totalRequests}));

                console.log(`${word}: ${definition}`); ///////////////////// DEbuGGING
            });

    } else if (pathname === "/api/definitions" && req.method === "GET") {
        const word = params.get("word");
        const definition = dictionary.get(word);

        console.log(`${word}: ${definition}`) /////////////////////////// DEBUGGING

        if(!definition) {
            res.writeHead(404, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: "NOT FOUND", message: `definition not found`, totalRequests}));
            return;
        }
        res.end(JSON.stringify({"definition": definition, totalRequests}));    
    } else {
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: "NOT FOUND", message: "api path not found", totalRequests}));
    }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



// //num_request

// {
//     error: asdfasdf,
//     message: lakdjslkfajsdljf
// }