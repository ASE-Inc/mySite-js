// Take care of vendor prefixes.
self.postMessage=self.webkitPostMessage||self.postMessage;
addEventListener('message',function(event){
    var xhr=new XMLHttpRequest();
    xhr.open('GET',event.data,false);
    xhr.send();
    postMessage({
        responseText:xhr.responseText,
        readyState:xhr.readyState,
        status:xhr.status,
        url:event.data
    });
},false);