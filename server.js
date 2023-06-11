
my_http = require("http");
path = require("path");
url = require("url");
filesys = require("fs");

let port = process.argv[2]
if (port == undefined)
    port = 8080;

let names = []

// Create HTTP server
let server = my_http.createServer(function (request, response) {

    // Get user request path
    var my_path = url.parse(request.url).pathname;
    var full_path = path.join(process.cwd(), my_path);

    //console.log(url.parse(request.url, true).href);

    // Wait until the full request body is sent
    let body = [];
    request.on('data', (chunk) => {
        body.push(chunk);
    }).on('end', () => {
        // Now parse the request url
        body = Buffer.concat(body).toString();

        if (my_path == "/") {
            // Request is root
            console.log("root");
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.write('Hello World!');
            response.end();

        } else if (my_path.startsWith("/api/")) {
            // Request is an API call
            let api_call = my_path.substring(5, my_path.length);
            //console.log(api_call)
            // Enumerate get and post calls with their callbacks
            var dict_get = {
                "read_todos": api_read_todos,
                "read_wr": api_read_wr,
                "read_rn": api_read_rn,
            }
            var dict_post = {
                "update_todos": api_update_todos,
                "update_wr": api_update_wr,
                "update_rn": api_update_rn,
            };

            if (api_call in dict_get) {
                // Call back for GET
                let ret = dict_get[api_call](request);
                response.writeHead(ret["code"], ret["header"]);
                response.write(ret["body"]);
                response.end();
            } else if (api_call in dict_post) {
                // Call back for POST
                let ret = dict_post[api_call](request, body);
                response.writeHead(ret["code"], ret["header"]);
                response.write(ret["body"]);
                response.end();
            } else {
                // 404
                console.log("api not found : " + api_call);
                response.writeHead(404, { 'Content-Type': 'text/html' });
                response.write('{}');
                response.end();
            }

        } else {
            // Request is none of the above, may be a file?
            let filepath = my_path.substring(1, my_path.length);

            //console.log(filepath)
            // Must start by a letter
            if (!/^[a-zA-Z]/.test(filepath)) {
                console.log("unauthorized");
                response.writeHead(401, { 'Content-Type': 'text/html' });
                response.write('Unauthorized file.');
                response.end();
                return;
            }

            filesys.exists(filepath, (exists) => {
                if (exists) {
                    // It is a file
                    let format = filepath.split('.')[filepath.split('.').length - 1];

                    let content_type = 'text/plain'

                    switch (format.toUpperCase()) {
                        case 'HTML':
                            content_type = 'text/html'
                            break;
                        case 'JS':
                            content_type = 'application/javascript'
                            break;
                        case 'CSS':
                            content_type = 'text/css'
                            break;
                        case 'JPG':
                            content_type = 'image/jpeg'
                            break;
                    }

                    //console.log("found file " + filepath);
                    response.writeHead(200, { 'Content-Type': content_type });
                    response.write(filesys.readFileSync(filepath));
                    response.end();

                } else {
                    // It is not a file
                    console.log("file not found : " + filepath);
                    response.writeHead(404, { 'Content-Type': 'text/html' });
                    response.write('Not found.');
                    response.end();
                }

            });
        }
    });

}).listen(port);

// Write a str to a file
function write_file(path, content) {
    try {
        filesys.writeFileSync(path, content);
    } catch (err) {
        console.error(err);
    }
}

// Read an str from a file
function read_file(path) {
    try {
        const data = filesys.readFileSync(path, 'utf8');
        return data;
    } catch (err) {
        console.error(err);
        return ""
    }
}

// Api callback /api/read_todos
function api_read_todos(request) {
    let content = read_file("data/todos.json");
    return { "code": 200, "header": { 'Content-Type': 'application/json' }, "body": content };
}

// Api callback /api/update_todos
function api_update_todos(request, body) {
    let old_contents = JSON.parse(read_file("data/todos.json"));
    let new_content = JSON.parse(body);
    old_contents[new_content.id] = new_content
    write_file("data/todos.json", JSON.stringify(old_contents))
    return { "code": 200, "header": { 'Content-Type': 'application/json' }, "body": "{}" };
}

// Api callback /api/update_wr
function api_update_wr(request, body) {
    let old_contents = JSON.parse(read_file("data/wrs.json"));
    let new_content = JSON.parse(body);
    old_contents[new_content.id] = new_content
    if (parseInt(new_content.id)+1 in old_contents == false) {
        old_contents[parseInt(new_content.id)+1] = {"id":(parseInt(new_content.id)+1).toString(),"content":""}
    }
    write_file("data/wrs.json", JSON.stringify(old_contents))
    return { "code": 200, "header": { 'Content-Type': 'application/json' }, "body": "{}" };
}

// Api callback /api/read_wr
function api_read_wr(request) {
    let content = read_file("data/wrs.json");
    return { "code": 200, "header": { 'Content-Type': 'application/json' }, "body": content };
}

// Api callback /api/update_rn
function api_update_rn(request, body) {
    let old_contents = JSON.parse(read_file("data/rns.json"));
    let new_content = JSON.parse(body);
    old_contents[new_content.id] = new_content
    if (parseInt(new_content.id)+1 in old_contents == false) {
        old_contents[parseInt(new_content.id)+1] = {"id":(parseInt(new_content.id)+1).toString(),"content":""}
    }
    write_file("data/rns.json", JSON.stringify(old_contents))
    return { "code": 200, "header": { 'Content-Type': 'application/json' }, "body": "{}" };
}

// Api callback /api/read_rn
function api_read_rn(request) {
    let content = read_file("data/rns.json");
    return { "code": 200, "header": { 'Content-Type': 'application/json' }, "body": content };
}

console.log("Server Running on " + port);