# 🦈 Express Validate Decorator

Validate express routes with Joi. You can validate query and body.


## Example

Create a class for using decorators.
When query or body not validated by schema this method  will return 400 with Joi validation error message.

```js


import { validate, number, string, schema } from "express-validate-decorator";

import express from "express"
const app = express();
const port = 3000;

class UserService {

    constructor() {
        //validator respects your scope you can use bind safely
        this.getUser = this.getUser.bind(this);
    }
    
    //create validator schema
    @validate({
        query: {
            page: number.required(),
            count: number.required()
        },
        // you can add your custom schema 😱
        body: schema({
            a: Joi.number().min(1).max(10).integer(),
            b: 'some string'
        });
    })
    getUser(req, res){
        //use body or request without if conditions or null checks 
        res.send('Hello World!')
    }
}

const userService = new UserService()

app.get('/',userService.getUser)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
```

