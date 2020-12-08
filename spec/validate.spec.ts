import validate, { schema, number } from "../src/validate";
import Joi from "@hapi/joi";

describe("validate", () => {
  let query: any;
  let body: any;
  let params: any;

  class FakeService {
    serviceName: number;
    constructor(serviceName: number) {
      this.serviceName = serviceName;

      this.getName = this.getName.bind(this);
    }

    getName(req: any, res: any, next: any) {
      next(this.serviceName + req.body + req.query + req.params);
      res.status(200);
      return true;
    }
  }

  beforeEach(() => {
    query = {
      name: Math.random(),
    };

    body = {
      name: Math.random(),
    };

    params = {
      name: Math.random()
    }
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("when given objects is Joi schema, should use every valid schema", () => {
    jest.spyOn(Joi, "isSchema").mockImplementation(() => true);
    jest.spyOn(Joi, "object");

    validate({ body, query, params });

    expect(Joi.isSchema).toHaveBeenCalledWith(query);
    expect(Joi.isSchema).toHaveBeenCalledWith(body);
    expect(Joi.isSchema).toHaveBeenCalledWith(params);
    expect(Joi.object).not.toHaveBeenCalled();
  });

  it("when given objects is not Joi schema, should create every valid schema", () => {
    jest.spyOn(Joi, "isSchema").mockImplementation(() => false);
    jest.spyOn(Joi, "object").mockImplementation(() => ({} as any));

    const query: any = {
      name: Math.random(),
    };

    const body: any = {
      name: Math.random(),
    };

    const params: any = {
      name: Math.random(),
    };

    validate({ body, query, params });

    expect(Joi.isSchema).toHaveBeenCalledWith(query);
    expect(Joi.isSchema).toHaveBeenCalledWith(body);
    expect(Joi.isSchema).toHaveBeenCalledWith(params);

    expect(Joi.object).toHaveBeenCalledWith(query);
    expect(Joi.object).toHaveBeenCalledWith(body);
    expect(Joi.object).toHaveBeenCalledWith(params);
  });

  it("when given objects is empty, should throw error", () => {
    expect(() => validate({})).toThrow(Error);
  });

  describe("should override property descriptor", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("validation success", () => {
      jest.spyOn(Joi, "isSchema").mockImplementation(() => true);

      const querySchema: any = {
        validate: jest.fn().mockImplementation(() => ({})),
      };

      const bodySchema: any = {
        validate: jest.fn().mockImplementation(() => ({})),
      };

      const paramsSchema: any = {
        validate: jest.fn().mockImplementation(() => ({})),
      };

      const next = jest.fn();

      const result = validate({ body: bodySchema, query: querySchema, params: paramsSchema });

      const serviceName = Math.random();

      const fakeService = new FakeService(serviceName);

      const fakeServiceDescriptor = Object.getOwnPropertyDescriptor(
        fakeService,
        "getName"
      )!;

      const response = {
        status: jest.fn(),
        json: jest.fn(),
      };

      const request = {
        body: Math.random(),
        query: Math.random(),
        params: Math.random()
      };

      result(null, "", fakeServiceDescriptor);

      Object.defineProperty(fakeService, "getName", fakeServiceDescriptor);

      const serviceResult = fakeService.getName(request, response, next);

      expect(querySchema.validate).toHaveBeenCalledWith(request.query);
      expect(bodySchema.validate).toHaveBeenCalledWith(request.body);
      expect(paramsSchema.validate).toHaveBeenCalledWith(request.params);

      expect(next).toHaveBeenCalledWith(
        serviceName + request.body + request.query + request.params
      );
      expect(response.status).toHaveBeenCalledWith(200);

      expect(serviceResult).toStrictEqual(true);
    });

    it("validation success with unknown params schema test", () => {
      jest.spyOn(Joi, "isSchema").mockImplementation(() => true);
      const next = jest.fn();

      const result = validate({
        query: schema({
          page: number.required(),
        }).unknown(true),
      });

      const serviceName = Math.random();

      const fakeService = new FakeService(serviceName);

      const fakeServiceDescriptor = Object.getOwnPropertyDescriptor(
        fakeService,
        "getName"
      )!;

      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const request = {
        query: {
          page: Math.floor(Math.random() * 10),
          q: Math.random(),
        },
      };

      result(null, "", fakeServiceDescriptor);

      Object.defineProperty(fakeService, "getName", fakeServiceDescriptor);

      const serviceResult = fakeService.getName(request, response, next);

      expect(response.status).toHaveBeenCalledWith(200);

      expect(serviceResult).toStrictEqual(true);
    });

    it("validation error", () => {
      jest.spyOn(Joi, "isSchema").mockImplementation(() => true);

      const querySchema: any = {
        validate: jest.fn(),
      };

      const bodySchema: any = {
        validate: jest.fn(),
      };

      const paramsSchema: any = {
        validate: jest.fn(),
      };

      const next = jest.fn();

      const result = validate({ body: bodySchema, query: querySchema, params: paramsSchema });

      const serviceName = Math.random();

      const fakeService = new FakeService(serviceName);

      const fakeServiceDescriptor = Object.getOwnPropertyDescriptor(
        fakeService,
        "getName"
      )!;

      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const request = {
        body: Math.random(),
        query: Math.random(),
        params: Math.random()
      };

      result(null, "", fakeServiceDescriptor);

      Object.defineProperty(fakeService, "getName", fakeServiceDescriptor);

      const bodySchemaError = Math.random();
      const querySchemaError = Math.random();
      const paramsSchemaError = Math.random();

      querySchema.validate
        .mockImplementationOnce(() => ({
          error: { message: querySchemaError },
        }))
        .mockImplementation(() => ({}));

      bodySchema.validate
        .mockImplementationOnce(() => ({
          error: { message: bodySchemaError },
        }))
        .mockImplementation(() => ({}));

      paramsSchema.validate
        .mockImplementationOnce(() => ({
          error: { message: paramsSchemaError },
        }))
        .mockImplementation(() => ({}));

      // query error
      let serviceResult = fakeService.getName(request, response, next);
      expect(response.json).toHaveBeenCalledWith(
        { message: "Query Error " + querySchemaError }
      );
      expect(serviceResult).toBeUndefined();

      // body error
      serviceResult = fakeService.getName(request, response, next);
      expect(response.json).toHaveBeenCalledWith(
        { message: "Body Error " + bodySchemaError }
      );
      expect(serviceResult).toBeUndefined();

      // params error
      serviceResult = fakeService.getName(request, response, next);
      expect(response.json).toHaveBeenCalledWith(
        { message: "Params Error " + paramsSchemaError }
      );
      expect(serviceResult).toBeUndefined();


      // result
      expect(response.status).toHaveBeenNthCalledWith(3, 400);
    });

    it("no validation", () => {
      jest.spyOn(Joi, "isSchema").mockImplementation(() => true);

      const querySchema: any = {
        validate: jest.fn().mockImplementation(() => ({})),
      };

      const bodySchema: any = {
        validate: jest.fn().mockImplementation(() => ({})),
      };

      const paramsSchema: any = {
        validate: jest.fn().mockImplementation(() => ({})),
      };

      const next = jest.fn();

      const result = validate({ body: bodySchema, query: querySchema, params: paramsSchema });

      const serviceName = Math.random();

      const fakeService = new FakeService(serviceName);

      const fakeServiceDescriptor = Object.getOwnPropertyDescriptor(
        fakeService,
        "getName"
      )!;

      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const request = {
        body: Math.random(),
        query: Math.random(),
        params: Math.random()
      };

      result(null, "", fakeServiceDescriptor);

      Object.defineProperty(fakeService, "getName", fakeServiceDescriptor);

      const serviceResult = fakeService.getName(request, response, next);

      expect(serviceResult).toStrictEqual(true);
    });
  });
});
