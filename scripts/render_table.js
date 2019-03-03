/* p
config = {
    columns : [
        { title : "name", key : "name" },
        { title : "running", renderer : (x) => x.running ? "yes" : "no" },
        { title : "running1", rendererX : (x) => `<td><span class="${x.running ? "text-success" : "text-danger"}">${x.running ? "Running" : "Stopped"}</span></td>` },
        { titleX : '<th class="text-danger">Dangerous Zone</th>', rendererX : () => "" }
    ]
}
*/

function getTableRenderer(config) {
    return function(x) {
        res = "<table border='0' class='table'>";

        res += "<tr>";
        for (var _i in config.columns) {
            var i = config.columns[_i];
            
            if ("titleX" in i) {
                res += i["titleX"];
            } else {
                res += `<th>${i["title"]}</th>`;
            }
        }
        res += "</tr>";

        for (var _i in x) {
            var i = x[_i];

            res += "<tr>";
            for (var _h in config.columns) {
                var h = config.columns[_h];
                
                if ("rendererX" in h) {
                    res += h["rendererX"](i);
                } else if ("renderer" in h) {
                    res += `<td>${h["renderer"](i)}</td>`;
                } else {
                    var key = h["key"] || "";
                    res += `<td>${i[key]}</td>`;
                }
            }
            res += "</tr>";
        }

        res += "</table>";
        return res;
    }
}
