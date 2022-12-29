const express = require("express");
const mongoose = require("mongoose");
const account = require(__dirname + "/account");
const _ = require("lodash");
const app = express();

app.use("/", express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

mongoose.connect(
  // It doesn't seem to work if account.passwd contains !@#$
  `mongodb+srv://${account.id}:${account.passwd}@cluster0.zzv9r.mongodb.net/todoListDB?retryWrites=true&w=majority`
);
const TodoItemSchem = { name: String };
const TodoItem = mongoose.model("TodoItem", TodoItemSchem);

const UserItemSchem = { name: String, items: [TodoItemSchem] };
const UserItem = mongoose.model("UserItem", UserItemSchem);

const todoItem_1 = new TodoItem({
  name: "Sleep on time",
});
const todoItem_2 = new TodoItem({
  name: "Work hard",
});
const todoItem_3 = new TodoItem({
  name: "Study harder",
});
const todoItemList = [todoItem_1, todoItem_2, todoItem_3];

app.get("/", function (req, res) {
  TodoItem.find(function (err, items) {
    if (err) {
      console.error(err);
    } else {
      if (items.length === 0) {
        TodoItem.insertMany(todoItemList, function (err) {
          if (err) {
            console.error(err);
          }
        });
      }

      res.render("list", { listTitle: "Today", todoList: items });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const todoItem = new TodoItem({ name: itemName });

  if (listName === "Today") {
    todoItem.save();
    res.redirect("/");
  } else {
    UserItem.findOne({ name: listName }, function (err, userList) {
      if (err) {
        console.error(err);
      } else {
        userList.items.push(todoItem);
        userList.save();
        res.redirect("/" + listName);
      }
    });
  }
});

app.post("/delete", function (req, res) {
  const itemId = req.body.checked;
  const listName = req.body.list;

  if (listName === "Today") {
    TodoItem.findByIdAndRemove(itemId, function (err) {
      //TodoItem.deleteOne({id:itemId}, function(err) {
      if (err) {
        console.error(err);
      }
      res.redirect("/");
    });
  } else {
    // Update(remove) item using $pull operator
    UserItem.findOneAndUpdate(
      { name: listName },
      {
        $pull: {
          items: { _id: itemId },
        },
      },
      function (err, userList) {
        if (err) {
          console.error(err);
        } else {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/:userList", function (req, res) {
  if (req.params.userList === "favicon.ico") {
    res.status(204);
  } else {
    const userListTitle = _.capitalize(req.params.userList);
    console.log(userListTitle);
    UserItem.findOne({ name: userListTitle }, function (err, userList) {
      if (err) {
        console.error(err);
      } else {
        if (userList) {
          res.render("list", {
            listTitle: userList.name,
            todoList: userList.items,
          });
        } else {
          const userItem = new UserItem({
            name: userListTitle,
            items: todoItemList,
          });
          userItem.save();
          res.redirect("/" + userListTitle);
        }
      }
    });
  }
});

// app.get("/about", function (req, res) {
//   res.render("about");
// });

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
  console.log("Server is running");
});
