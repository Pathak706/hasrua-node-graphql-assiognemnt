var express = require("express");
var { graphqlHTTP } = require("express-graphql");
var { buildSchema } = require("graphql");
const graphql = require("graphql.js");
const jwt = require("jsonwebtoken");

// JWT Secret Key
const secret =
  "3EK6FD+o0+c7tzBNVfjpMkNDi2yARAAKzQlk8O2IKoxQu4nF7EdAh8s3TwpHwrdWT6R";

// Construct a schema, using GraphQL schema language
var schema = buildSchema(`
scalar UUID

type UserTracking {
  id: UUID
  user_id: UUID
  lat: String
  lng: String
}

  type User {
    id: UUID
    first_name: String
    last_name: String
    gender: String
    user_tracking: [UserTracking]
  }

  type Query {
    findNearByUser(radius: Int!): [User]
    listUser: [User]
  }
`);

// The root provides a resolver function for each API endpoint
var root = {
  listUser: () => {
    return getUserList(10, 0);
  },

  findNearByUser: async ({ radius }, context, root) => {
    let currentUser = jwt.verify(context.headers.authorization, secret);
    let userLocationList = await getUserListWithLocation();

    let userIndex = userLocationList.findIndex(
      (user) => user.id === currentUser.user.id
    );
    currentUser = userLocationList.splice(userIndex, 1)[0];

    const centerPoint = {
      lat: currentUser.user_tracking[0].lat,
      lng: currentUser.user_tracking[0].lng,
    };

    let result = []

    function radiusCalculator(checkPoint, centerPoint, radius) {
      var deltaY = 40000 / 360;
      var deltaX = Math.cos((Math.PI * centerPoint.lat) / 180.0) * deltaY;
      var daviationX = Math.abs(centerPoint.lng - checkPoint.lng) * deltaX;
      var daviationY = Math.abs(centerPoint.lat - checkPoint.lat) * deltaY;
      return (
        Math.sqrt(daviationX * daviationX + daviationY * daviationY) <= radius
      );
    }

    for (let i = 0; i < userLocationList.length; i++) {
      if (userLocationList[i].user_tracking[0]) {
        let checkPoint = {
          lat: userLocationList[i].user_tracking[0].lat,
          lng: userLocationList[i].user_tracking[0].lng,
        };
        let nearby = radiusCalculator(checkPoint, centerPoint, radius);
        if (nearby) {
          result.push(userLocationList[i]);
        }
      }
    }
    console.log(JSON.stringify(result));
    return result;
  },
};

// auth middleware for Graphql API
const authMiddleware = (req, res, next) => {
  try {
    if (!jwt.verify(req.headers.authorization, secret)) {
      return res.sendStatus(401);
    }
  } catch {
    return res.sendStatus(401);
  }
  next();
};

// creating a express server
var app = express();

// get token endpoint to generate JWT token for admin/admin
app.use("/token", async (req, res, next) => {
  // @TODO: implement  user auth instead of admin/admin
  if (req.query.username === "admin" && req.query.password === "admin") {
    const user = await getUserList(1, 0); // using first hasura user to generate jwt token for hasura
    const claims = {
      user: user[0],
      "https://hasura.io/jwt/claims": {
        "x-hasura-allowed-roles": ["user", "admin"],
        "x-hasura-default-role": "admin",
        "x-hasura-user-id": user[0].id,
      },
    };

    let token = {
      token: jwt.sign(claims, secret),
    };
    return res.status(200).json({ message: "login successfull", data: token });
  } else {
    return res.status(401).json({ message: "wrong username or password" });
  }
});

// verify token to validate JWT token
app.use("/verify", (req, res, next) => {
  try {
    if (jwt.verify(req.headers.authorization, secret))
      return res.sendStatus(200);
  } catch {
    return res.sendStatus(401);
  }
});

// graphql integration with hasura to featch user list
function getUserList(limit = 10, offset = 0) {
  const query = `query($limit:Int, $offset:Int){
        user(limit: $limit, offset: $offset, order_by: {first_name: asc}) {
            id
            first_name
            last_name
            gender
        }
      }`;

  return graphql(`http://localhost:8080/v1/graphql`, {
    method: "POST",
    asJSON: true,
    headers: {
      "X-Hasura-Admin-Secret": "KHJGjhgjhgJHG",
    },
    fragments: {},
  })
    .query(query, { limit, offset })
    .then((data) => data.user)
    .catch((err) => console.log("Error came :::", err));
}

// graphql integration with hasura to featch user list with location info
function getUserListWithLocation(limit = 10, offset = 0) {
  const query = `query($limit:Int, $offset:Int){
        user(limit: $limit, offset: $offset, order_by: {first_name: asc}) {
            id
            first_name
            last_name
            gender
            user_tracking {
              lat
              lng
            }
        }
      }`;

  return graphql(`http://localhost:8080/v1/graphql`, {
    method: "POST",
    asJSON: true,
    headers: {
      "X-Hasura-Admin-Secret": "KHJGjhgjhgJHG",
    },
    fragments: {},
  })
    .query(query, { limit, offset })
    .then((data) => data.user)
    .catch((err) => console.log("Error came :::", err));
}

// applying jwt auth middleware
// initializing graphql server of node
app.use("/graphql", [authMiddleware], (req, res) =>
  graphqlHTTP({ schema, rootValue: root, context: req })(req, res)
);

// starting server listing on port
app.listen(9000);
console.log("Running a GraphQL API server at http://localhost:9000/graphql");
