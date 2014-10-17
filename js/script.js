
function xhrGet(reqUri, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", reqUri, true);
    xhr.onload = callback;
    xhr.send();
}


function xhrPost(reqUri, callback, data) {
    data = data || new FormData();
    /*
    data.append('user', 'person');
    data.append('pwd', 'password');
    data.append('organization', 'place');
    data.append('key', 'value-list');
    // data.append('file', file, file.name);
    */
    var xhr = new XMLHttpRequest();
    xhr.open('POST', reqUri, true);
    xhr.onload = callback;
    xhr.send(data);
}


function MakeFolderDiv(name){
    var div = document.createElement("div");
    div.className = "itms";

    div.onclick = function(){
        $('#jstreeContainer').jstree(true).deselect_all();
        $('#jstreeContainer').jstree(true).select_node(name);
        ls(name);
    }
    
    var imgc = document.createElement("div");
    imgc.style["width"] = "64px";
    imgc.style["height"] = "64px";
    imgc.style["margin"] = "auto";
    
    var img = document.createElement("img");
    img.src = "res/folder.png";
    img.style["width"] = "64px";
    img.style["height"] = "64px";

    var p = document.createElement("div");
    p.innerText = name.split("/").pop();
    p.className = "label";


    imgc.appendChild(img);
    div.appendChild(imgc);
    div.appendChild(p);
    return div;
}


function MakeFileDiv(name){
    var div = document.createElement("div");
    div.className = "itms";
    div.style["display"] = 'block';

    div.onclick = function(){
        var form = document.createElement('form');
        form.method = "post";
        form.action = 'get?'+name;
        form.submit();
    }

    var imgc = document.createElement("div");
    imgc.style["width"] = "64px";
    imgc.style["height"] = "64px";
    imgc.style["margin"] = "auto";
    
    var img = document.createElement("img");
    img.src = "res/file.png";
    img.style["width"] = "64px";
    img.style["height"] = "64px";

    var p = document.createElement("div");
    p.innerText = name.split("/").pop();
    p.className = "label";
    
    imgc.appendChild(img);
    div.appendChild(imgc);
    div.appendChild(p);
    return div;
}

function go_up(){
    if (curdir() == "/mappar") { return; /* root not permited*/ }

    splited = curdir().split("/");
    splited.pop();

    destFolder = splited.join("/");
    
    $('#jstreeContainer').jstree(true).deselect_all();
    $('#jstreeContainer').jstree(true).select_node(destFolder);
    ls(destFolder);
}

function mkdir(){
    var name = window.prompt("Ange namn:");
    if(name == "" || name.indexOf("/") > -1){ return; }

    var selected = curdir();    
    var path = selected + "/" + name;
    console.log(path);
    xhrPost("mkdir?" + path, function(){
        $("#jstreeContainer")
        .jstree(
            'create_node', 
            selected, 
            {'id' : path, 'text' : name}, 
            null);
        ls();
    });
}

function init_jstreeContainer(){
    $(function() {
        $('#jstreeContainer').jstree({ 'core' : {
            "animation" : 0,
            "multiple" : false,
            'check_callback': true,
            "data" : function(o, cb){
                var self = this;
                xhrPost("get_all_folders", function(){
                    //treeData = 
                    var folders = JSON.parse(this.responseText)["folders"];
                    var result = [];
                    for(var x = 0; x < folders.length; x++){
                        var id = folders[x];
                        var splited = folders[x].split("/");
                        var name = splited.pop();
                        var parrent = splited.join("/");
                        if(parrent == ""){ parrent = "#" }
                        result.push({   "id": id,
                                        "text": name,
                                        "parent": parrent });
                    }
                    cb.call(self, result);
                    $("#jstreeContainer").on('loaded.jstree', function (event, data) { 
                        $('#jstreeContainer').jstree(true).select_node('/mappar');
                    });
                });
            }
        } });
    //EVENT:
    $('#jstreeContainer')
        .on('changed.jstree', function (e, data) {
            if(data["action"] == "select_node"){
                ls( data["selected"][0] );
            }
        })
    });
}

window.onload = function(){
    init_jstreeContainer();
}

function curdir(){ return $('#jstreeContainer').jstree(true).get_selected()[0]; }


function ls(path){
    var path = path || curdir();
    $("#jstreeContainer").jstree("open_node", path);
    // ListFolder(path);
    xhrPost('ls?' + path, function(){
        data = JSON.parse(this.responseText)
        var container = document.getElementById("mainWindow");

        // Remove old:
        $('.itms').remove();
        // FOLDERS:
        var folders = data["folders"];
        for(var i = 0; i < folders.length; i++){
            var folder = MakeFolderDiv(data["folders"][i]);
            container.appendChild( folder );
        }
        // FILES:
        var files = data["files"];
        for(var i = 0; i < files.length; i++){
            var file = MakeFileDiv(data["files"][i]); 
            container.appendChild( file );
        }
    });    
}

function upload(url, done_callback){
    url = url || 'put?';
    var fileSelect = document.getElementById('file-select');
    var uploadButton = document.getElementById('upload-button');
    
    // Update button text.
    uploadButton.value = 'Uploading...';

    // Get the selected files from the input.
    var files = fileSelect.files;
    // Create a new FormData object.
    var formData = new FormData();
    // Loop through each of the selected files.
    var folder = curdir();
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var path = folder + '/' + file.name;
        // Add the file to the request.
        // pass as tuples/pairs (filename, filedata)
        formData.append('files', path);
        formData.append('files', file, file.name);
    }
    xhrPost(url, function () {
        if (this.status != 200) { return; }
        // File(s) uploaded.
        uploadButton.value = 'Upload';
        if(typeof done_callbeck != 'undefined') { 
            done_callbeck(this.responseText);        
        }
    }, formData);
    ls();
}
