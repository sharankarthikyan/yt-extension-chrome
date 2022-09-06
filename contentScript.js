(async () => {

    var jsonClosingChars = /^[)\]}'\s]+/;
    var ESCAPING_SEQUENZES = [
        // Strings
        { start: '"', end: '"' },
        { start: "'", end: "'" },
        { start: '`', end: '`' },
        // RegeEx
        { start: '/', end: '/', startPrefix: /(^|[[{:;,])\s+$/ },
    ];

    function between(haystack, left, right) {
        let pos;
        if (left instanceof RegExp) {
            const match = haystack.match(left);
            if (!match) { return ''; }
            pos = match.index + match[0].length;
        } else {
            pos = haystack.indexOf(left);
            if (pos === -1) { return ''; }
            pos += left.length;
        }
        haystack = haystack.slice(pos);
        pos = haystack.indexOf(right);
        if (pos === -1) { return ''; }
        haystack = haystack.slice(0, pos);
        return haystack;
    }

    function cutAfterJS(mixedJson) {
        // Define the general open and closing tag
        let open, close;
        if (mixedJson[0] === '[') {
            open = '[';
            close = ']';
        } else if (mixedJson[0] === '{') {
            open = '{';
            close = '}';
        }

        if (!open) {
            throw new Error(`Can't cut unsupported JSON (need to begin with [ or { ) but got: ${mixedJson[0]}`);
        }

        // States if the loop is currently inside an escaped js object
        let isEscapedObject = null;

        // States if the current character is treated as escaped or not
        let isEscaped = false;

        // Current open brackets to be closed
        let counter = 0;

        let i;
        // Go through all characters from the start
        for (i = 0; i < mixedJson.length; i++) {
            // End of current escaped object
            if (!isEscaped && isEscapedObject !== null && mixedJson[i] === isEscapedObject.end) {
                isEscapedObject = null;
                continue;
                // Might be the start of a new escaped object
            } else if (!isEscaped && isEscapedObject === null) {
                for (const escaped of ESCAPING_SEQUENZES) {
                    if (mixedJson[i] !== escaped.start) continue;
                    // Test startPrefix against last 10 characters
                    if (!escaped.startPrefix || mixedJson.substring(i - 10, i).match(escaped.startPrefix)) {
                        isEscapedObject = escaped;
                        break;
                    }
                }
                // Continue if we found a new escaped object
                if (isEscapedObject !== null) {
                    continue;
                }
            }

            // Toggle the isEscaped boolean for every backslash
            // Reset for every regular character
            isEscaped = mixedJson[i] === '\\' && !isEscaped;

            if (isEscapedObject !== null) continue;

            if (mixedJson[i] === open) {
                counter++;
            } else if (mixedJson[i] === close) {
                counter--;
            }

            // All brackets have been closed, thus end of JSON is reached
            if (counter === 0) {
                // Return the cut JSON
                return mixedJson.substring(0, i + 1);
            }
        }

        // We ran through the whole string and ended up with an unclosed bracket
        throw Error("Can't cut unsupported JSON (no matching closing bracket found)");
    }


    function parseJSON(source, varName, json) {
        if (!json || typeof json === 'object') {
            return json;
        } else {
            try {
                json = json.replace(jsonClosingChars, '');
                return JSON.parse(json);
            } catch (err) {
                throw Error(`Error parsing ${varName} in ${source}: ${err.message}`);
            }
        }
    }

    function findJSON(source, varName, body, left, right, prependJSON) {
        let jsonStr = between(body, left, right);
        if (!jsonStr) {
            throw Error(`Could not find ${varName} in ${source}`);
        }
        return parseJSON(source, varName, cutAfterJS(`${prependJSON}${jsonStr}`));
    }

    // __________________________________________________________________________________________________________



    var url = document.location.href;

    var body = await fetch(url).then(async (res) => {
        return await res.text();
    }).then((data) => {
        return data;
    })

    var info = { page: 'watch' };

    try {
        cver = between(body, '{"key":"cver","value":"', '"}');
        info.player_response = findJSON('watch.html', 'player_response', body, /\bytInitialPlayerResponse\s*=\s*\{/i, '</script>', '{');
        console.log(info.player_response.streamingData.adaptiveFormats);
        var formats = info.player_response.streamingData.adaptiveFormats;
        // var videoContainer = document.getElementsByClassName("html5-video-container")[0];
        var videoContainer = document.getElementsByClassName("html5-video-player")[0];
        var container = document.getElementById("container");
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
        // ul.textContent = "Download";
        for (let i = 0; i < formats.length; i++) {
            if (!formats[i].url) {
                formats[i].url = formats[i].signatureCipher.split("&")[2].split("=")[1];
            }
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
        // container.appendChild(ul);
    } catch (err) {
        let args = findJSON('watch.html', 'player_response', body, /\bytplayer\.config\s*=\s*{/, '</script>', '{');
        info.player_response = findPlayerResponse('watch.html', args);
    }

})()