import validate, { schema, number } from "../src/validate";
import Joi from "@hapi/joi";

describe("validate", () => {
  let query: any;
  let body: any;

  class FakeService {
    serviceName: number;
    constructor(serviceName: number) {
      this.serviceName = serviceName;

      this.getName = this.getName.bind(this);
    }

    getName(req: any, res: any, next: any) {
      next(this.serviceName + req.body + req.query);
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
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("when given objects is Joi schema, should use both schema", () => {
    jest.spyOn(Joi, "isSchema").mockImplementation(() => true);
    jest.spyOn(Joi, "object");

    validate({ body, query });

    expect(Joi.isSchema).toHaveBeenCalledWith(query);
    expect(Joi.isSchema).toHaveBeenCalledWith(body);
    expect(Joi.object).not.toHaveBeenCalled();
  });

  it("when given objects is not Joi schema, should create both schema", () => {
    jest.spyOn(Joi, "isSchema").mockImplementation(() => false);
    jest.spyOn(Joi, "object").mockImplementation(() => ({} as any));

    const query: any = {
      name: Math.random(),
    };

    const body: any = {
      name: Math.random(),
    };

    validate({ body, query });

    expect(Joi.isSchema).toHaveBeenCalledWith(query);
    expect(Joi.isSchema).toHaveBeenCalledWith(body);

    expect(Joi.object).toHaveBeenCalledWith(query);
    expect(Joi.object).toHaveBeenCalledWith(body);
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

      const next = jest.fn();

      const result = validate({ body: bodySchema, query: querySchema });

      const serviceName = Math.random();

      const fakeService = new FakeService(serviceName);

      const fakeServiceDescriptor = Object.getOwnPropertyDescriptor(
        fakeService,
        "getName"
      )!;

      const response = {
        status: jest.fn(),
        send: jest.fn(),
      };

      const request = {
        body: Math.random(),
        query: Math.random(),
      };

      result(null, "", fakeServiceDescriptor);

      Object.defineProperty(fakeService, "getName", fakeServiceDescriptor);

      const serviceResult = fakeService.getName(request, response, next);

      expect(querySchema.validate).toHaveBeenCalledWith(request.query);
      expect(bodySchema.validate).toHaveBeenCalledWith(request.body);

      expect(next).toHaveBeenCalledWith(
        serviceName + request.body + request.query
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
        send: jest.fn(),
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

      const next = jest.fn();

      const result = validate({ body: bodySchema, query: querySchema });

      const serviceName = Math.random();

      const fakeService = new FakeService(serviceName);

      const fakeServiceDescriptor = Object.getOwnPropertyDescriptor(
        fakeService,
        "getName"
      )!;

      const response = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      const request = {
        body: Math.random(),
        query: Math.random(),
      };

      result(null, "", fakeServiceDescriptor);

      Object.defineProperty(fakeService, "getName", fakeServiceDescriptor);

      const bodySchemaError = Math.random();
      const querySchemaError = Math.random();

      bodySchema.validate
        .mockImplementationOnce(() => ({
          error: { message: bodySchemaError },
        }))
        .mockImplementationOnce(() => ({}));

      querySchema.validate
        .mockImplementationOnce(() => ({
          error: { message: querySchemaError },
        }))
        .mockImplementationOnce(() => ({}));

      // query error
      let serviceResult = fakeService.getName(request, response, next);

      expect(response.send).toHaveBeenCalledWith(
        "Query Error " + querySchemaError
      );
      expect(serviceResult).toBeUndefined();

      // body error
      serviceResult = fakeService.getName(request, response, next);
      expect(response.send).toHaveBeenCalledWith(
        "Body Error " + bodySchemaError
      );
      expect(serviceResult).toBeUndefined();

      // result
      expect(response.status).toHaveBeenNthCalledWith(2, 400);
    });

    it("no validation", () => {
      jest.spyOn(Joi, "isSchema").mockImplementation(() => true);

      const querySchema: any = {
        validate: jest.fn().mockImplementation(() => ({})),
      };

      const bodySchema: any = {
        validate: jest.fn().mockImplementation(() => ({})),
      };

      const next = jest.fn();

      const result = validate({ body: bodySchema, query: querySchema });

      const serviceName = Math.random();

      const fakeService = new FakeService(serviceName);

      const fakeServiceDescriptor = Object.getOwnPropertyDescriptor(
        fakeService,
        "getName"
      )!;

      const response = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      const request = {
        body: Math.random(),
        query: Math.random(),
      };

      result(null, "", fakeServiceDescriptor);

      Object.defineProperty(fakeService, "getName", fakeServiceDescriptor);

      const serviceResult = fakeService.getName(request, response, next);

      expect(serviceResult).toStrictEqual(true);
    });
  });
});
