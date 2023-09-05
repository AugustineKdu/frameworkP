
let url =  require('url');
let fs = require('fs');

function renderHTML(path,response) {
    fs.readFile(path,null, function(err, data){
        if(err){
            response.writeHead(404);
            response.write('File not found');
        }else{
            response.write(data);
        }
        response.end();
    });
}

module.exports = {
    handleRequest:function(request,response){
        response.w
    }
}