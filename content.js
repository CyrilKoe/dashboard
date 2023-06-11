var num_todos = 0;
var list_todos = [];

// Adds a todo item in the html page
function add_todo(id, todo, deadline, more_infos) {
    // Make it the deadline is in the future
    let bold = is_future(deadline) ? "style=\"font-weight: bold;\"" : ""
    // Get html div to add it the todo
    let todo_rows_obj = document.getElementById("todo-rows");
    // Hilight the todo if it has news this week
    let highlight = more_infos.includes(`// Week ${get_week()}`) ? "class=\"table-active\"" : ""
    // Content of the todo
    let id_content = `<th scope=\"row\"><u data-toggle=\"modal\" data-target=\"#modal${id}\">${id}</u></th>`
    let todo_content = `<td ${bold}>${todo}</td>`
    let dead_content = `<td ${bold}>${deadline}</td>`
    let content = `<tr ${highlight}>` + id_content + todo_content + dead_content + "</tr>"
    todo_rows_obj.innerHTML = todo_rows_obj.innerHTML + content
    // Get html div to add the pop-up code
    let todo_modals_obj = document.getElementById("todo-modals");
    // Content of the pop-up page
    let modal_content =
        `<div class="modal fade" id="modal${id}" tabindex="-1" role="dialog" aria-labelledby="modal${id}Label" aria-hidden="true">
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modal${id}Label">Modal title</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                    <form class="form-inline">
                    <div class="form-group">
                      <label for="title">Title:</label>
                      <input type="text" class="form-control" id="modal${id}title" value="${todo}">
                    </div>
                    <div class="form-group">
                      <label for="deadline">Deadline:</label>
                      <input type="text" class="form-control" id="modal${id}deadline" value="${deadline}">
                    </div>
                    <div class="form-group">
                      <label for="notes">Notes:</label>
                      <textarea class="form-control" id="modal${id}notes" rows="15">${more_infos}</textarea>
                    </div>
                  </form> 
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="update_todo(${id});">Save changes</button>
                    </div>
                </div>
            </div>
        </div>`
    // Add the pop-up code
    todo_modals_obj.innerHTML = todo_modals_obj.innerHTML + modal_content;
    // Count number of todos (if we create a new one)
    num_todos = num_todos + 1;
}

// Returns 1 if date_a is after date_b in format "dd/mm/yyyy"
function compare_dates(a, b) {
    let w_a = a.split('/')
    let w_b = b.split('/')
    for (let i = w_a.length - 1; i >= 0; i--) {
        if (w_a[i] < w_b[i]) {
            return 0;
        }
        if (w_a[i] > w_b[i]) {
            return 1;
        }
    }
    return 1;
}

// Get today in format "dd/mm/yyyy"
function get_day() {
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1; // Months start at 0!
    let dd = today.getDate();
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    const formattedToday = dd + '/' + mm + '/' + yyyy;
    return formattedToday
}

// Return 1 if str_date is in the future ("dd/mm/yyyy")
function is_future(str_date) {
    return compare_dates(str_date, get_day())
}

// Order the global list of todos (list_todos) by date
function order_list_by_date() {
    // Order dates chronogically
    list_todos.sort(function (a, b) { return compare_dates(a[2], b[2]) });
    let i = 0;
    // Get seperation between dates in the future and dates in the pasts
    for (i; i < list_todos.length; i++) {
        if (is_future(list_todos[i][2])) {
            break;
        }
    }
    // Show dates in the future chronogically
    for (let j = i; j < list_todos.length; j++) {
        [id, todo, deadline, notes] = list_todos[j]
        add_todo(id, todo, deadline, notes)
    }
    // Show dates in the past reverse-chronogically
    for (let j = i - 1; j >= 0; j--) {
        [id, todo, deadline, notes] = list_todos[j]
        add_todo(id, todo, deadline, notes)
    }
}

// Get week from URL
function get_week() {
    let query_string = window.location.search;
    let url_params = new URLSearchParams(query_string);
    return url_params.get('week') == null ? 23 : url_params.get('week')
}

function replace_arg(url, arg, value) {
    if (value == null) {
        value = '';
    }
    var pattern = new RegExp('\\b('+arg+'=).*?(&|#|$)');
    if (url.search(pattern)>=0) {
        return url.replace(pattern,'$1' + value + '$2');
    }
    url = url.replace(/[?#]$/,'');
    return url + (url.indexOf('?')>0 ? '&' : '?') + arg + '=' + value;
}

// Api call to get all the todos items
async function api_fetch_todos() {
    fetch("/api/read_todos")
        .then((response) => response.json())
        .then((data) => {
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    list_todos.push([data[key].id, data[key].title, data[key].deadline, data[key].notes])
                }
            }
            order_list_by_date();
        })
        .catch((error) => console.log(error));

}

// Api calll to update one todo item
async function api_update_todos(id, title, deadline, notes) {
    if (id == 0) {
        id = num_todos
    }
    let content = { "id": id, "title": title, "deadline": deadline, "notes": notes }
    fetch("/api/update_todos", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
    })
        .then((response) => response.json())
        .then((data) => {
            location.reload();
        })
        .catch((error) => console.log(error));
}

// Update one todo item
async function update_todo(id) {
    // Get the values in the html file
    let title_entry = document.getElementById(`modal${id}title`);
    let deadline_entry = document.getElementById(`modal${id}deadline`);
    let notes_entry = document.getElementById(`modal${id}notes`);
    api_update_todos(id, title_entry.value, deadline_entry.value, notes_entry.value)
}

// Api call to fetch the weekly report
// Todo: add ids to weekly report
async function api_fetch_wr(id) {
    fetch("/api/read_wr")
        .then((response) => response.json())
        .then((data) => {
            let content = document.getElementById("wr_pages")
            for (const id in data) {
                let new_url = replace_arg(window.location.href, "week", id)
                let button_color = id == get_week() ? "dark" : "secondary"
                content.innerHTML =
                  `<button type=\"button\" class=\"btn btn-${button_color}\"
                  onclick=\"window.location='${new_url}'\";
                  >${id}</button>`
                  + content.innerHTML
            }
            document.getElementById("wr_notes").value = data[id].content
        })
        .catch((error) => console.log(error));

}

// Api call to update one weekly report
async function api_update_wr(id, content) {
    let new_content = { "id": id, "content": content };
    fetch("/api/update_wr", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(new_content)
    })
        .then((response) => response.json())
        .then((data) => {
            location.reload();
        })
        .catch((error) => console.log(error));
}

async function update_wr(id) {
    let content = document.getElementById("wr_notes").value
    api_update_wr(id, content)
}

// Api call to fetch the reading note
async function api_fetch_rn(id) {
    fetch("/api/read_rn")
        .then((response) => response.json())
        .then((data) => {
            let content = document.getElementById("rn_pages")
            for (const id in data) {
                let new_url = replace_arg(window.location.href, "week", id)
                let button_color = id == get_week() ? "dark" : "secondary"
                content.innerHTML =
                  `<button type=\"button\" class=\"btn btn-${button_color}\"
                  onclick=\"window.location='${new_url}'\";
                  >${id}</button>`
                  + content.innerHTML
            }
            document.getElementById("rn_notes").value = data[id].content
        })
        .catch((error) => console.log(error));

}

// Api call to update one reading note
async function api_update_rn(id, content) {
    let new_content = { "id": id, "content": content };
    fetch("/api/update_rn", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(new_content)
    })
        .then((response) => response.json())
        .then((data) => {
            location.reload();
        })
        .catch((error) => console.log(error));
}

async function update_rn(id) {
    let content = document.getElementById("rn_notes").value
    api_update_rn(id, content)
}
