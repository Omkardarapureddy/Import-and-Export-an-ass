const express = require("express");
const { open } = require("sqlite");
const app = express();
app.use(express.json());
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const sqlite3 = require("sqlite3");
let db = null;
const dbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running http://localhost:3000/");
    });
  } catch (e) {
    console.log("DB error:${e.message}");
    process.exit(1);
  }
};
dbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const outPutResult = (dbList) => {
  return {
    id: dbList.id,
    todo: dbList.todo,
    category: dbList.category,
    priority: dbList.priority,
    status: dbList.status,
    dueDate: dbList.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getQueryTodo = "";
  const { search_q = " ", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getQueryTodo = `SELECT * FROM todo WHERE   todo LIKE '%${search_q}%'
             AND status = '${status}'
             AND priority = '${priority}'`;
          data = await db.all(getQueryTodo);
          response.send(data.map((each) => outPutResult(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasCategoryAndStatusProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getQueryTodo = `SELECT * FROM todo WHERE status = '${status}'
             AND category = '${category}'`;
          data = await db.all(getQueryTodo);
          response.send(data.map((each) => outPutResult(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasCategoryAndPriorityProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getQueryTodo = `SELECT * FROM todo WHERE  priority = '${priority}'
             AND category = '${category}'`;
          data = await db.all(getQueryTodo);
          response.send(data.map((each) => outPutResult(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getQueryTodo = `SELECT * FROM todo WHERE   todo LIKE '%${search_q}%'
             AND priority = '${priority}'`;
        data = await db.all(getQueryTodo);
        response.send(data.map((each) => outPutResult(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getQueryTodo = `SELECT * FROM todo WHERE   todo LIKE '%${search_q}%'
             AND status = '${status}'`;
        data = await db.all(getQueryTodo);
        response.send(data.map((each) => outPutResult(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getQueryTodo = `SELECT * FROM todo WHERE  category = '${category}'`;
        data = await db.all(getQueryTodo);
        response.send(data.map((each) => outPutResult(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    default:
      getQueryTodo = `
            SELECT
                *
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%';`;
      data = await db.all(getQueryTodo);
      response.send(data.map((each) => outPutResult(each)));
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodo = `SELECT * FROM todo WHERE id=${todoId}`;
  const todoApp = await db.get(getTodo);
  console.log(todoId);
  response.send(outPutResult(todoApp));
});
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const reqDate = `SELECT * FROM todo WHERE due_date="${newDate}"`;
    const dbResponse = await db.all(reqDate);
    response.send(dbResponse.map((each) => outPutResult(each)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const todoDetalis = request.body;
  const { id, todo, category, priority, status, dueDate } = todoDetalis;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const updateDate = format(new Date(dueDate), "yyyy-MM-dd");
          const createTodo = `INSERT INTO todo(id,todo,category,priority,status,due_date) VALUES (${id},"${todo}","${category}" ,"${priority}","${status}","${updateDate}")`;
          const dbResponse = await db.run(createTodo);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  const todoQuery = `SELECT * FROM todo WHERE id=${todoId}`;
  const privousList = await db.get(todoQuery);

  const {
    todo = privousList.todo,
    category = privousList.category,
    priority = privousList.priority,
    status = privousList.status,
    dueDate = privousList.due_date,
  } = request.body;
  let updateTodo;

  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodo = `UPDATE todo SET todo="${todo}", category="${category}",priority="${priority}",status="${status},due_date="${dueDate}" WHERE id=${todoId}`;
        await db.run(updateTodo);
        response.send(`Status Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodo = `UPDATE todo SET todo="${todo}", category="${category}",priority="${priority}",status="${status},due_date="${dueDate}" WHERE id=${todoId}`;
        await db.run(updateTodo);
        response.send(`Priority Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case requestBody.todo !== undefined:
      updateTodo = `UPDATE todo SET todo="${todo}", category="${category}",priority="${priority}",status="${status},due_date="${dueDate}" WHERE id=${todoId}`;
      await db.run(updateTodo);
      response.send(`Todo Updated`);
      break;
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodo = `UPDATE todo SET todo="${todo}", category="${category}",priority="${priority}",status="${status},due_date="${dueDate}" WHERE id=${todoId}`;
        await db.run(updateTodo);
        response.send(`Category Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const changeDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodo = `UPDATE todo SET todo="${todo}", category="${category}",priority="${priority}",status="${status},due_date="${changeDate}" WHERE id=${todoId}`;
        await db.run(updateTodo);
        response.send(`Due Date Updated`);
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `DELETE FROM todo WHERE id=${todoId}`;
  await db.run(deleteTodo);
  response.send("Todo Deleted");
});

module.exports = app;
