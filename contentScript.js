var urlProcess = async () => {
    try {
        var responsedata;
        await fetch(`https://yt-server-live.herokuapp.com/urls?id=${new URL(location.href).searchParams.get("v")}`).then(res => res.json()).then(_data => {
            responsedata = _data;
        });
        var videoContainer = document.getElementsByClassName("html5-video-player")[0];
        var styleElement = `
        <style>
                   .download-button-container {
                       position: absolute;
                       right: 0;
                       top: 0;
                       background: #2980b9;
                       color: white;
                       padding: 10px 20px;
                       pointer-events: auto !important;
                       cursor: pointer;
                       z-index: 200;
                       font-size: 2rem;
                       font-weight: bold;
                   }

                   .download-button-container>ul {
                       display: none;
                       position: absolute;
                       top: 100%;
                       left: 0;
                       overflow: auto;
                       height: 500px;
                   }

                   .download-button-container:hover .download-option-lists {
                      display: block;
                   }

                   .download-option a {
                      display: block;
                      padding: 10px 20px;
                      background: #3498db;
                      color: white;
                      text-decoration: none;
                      font-size: 2rem;
                      font-weight: 400;
                      text-align: center;
                   }

                   .download-option a:hover {
                      background: #2980b9;
                   }

        </style>
        
        `
        var div = document.createElement("div");
        div.classList.add("download-button-container");
        div.textContent = "Download";
        var ul = document.createElement("ul");
        ul.classList.add("download-option-lists");
        var formats = responsedata.data.info.formats;
        for (let i = 0; i < formats.length; i++) {
            var li = `
            <li class="download-option">
               <a href="${formats[i].url}" download>${formats[i].qualityLabel}</a>
            </li>   
            `;
            ul.innerHTML += li;
        }
        ul.innerHTML += styleElement;
        div.appendChild(ul);
        videoContainer.appendChild(div);
    } catch (err) {
        console.error(err.message);
    }

}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.message === 'onurlchanged') {
        urlProcess();
    }

});
urlProcess();