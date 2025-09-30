# How to create your API

## Assumed problem background

You need to create an API, under certain module, with certain action, let us call it `somewhat-module`, and `somewhat-action`.
### 1. Setup folder
1. Create a folder called `somewhat-module` under `backend/apps/base-system/src/api`. Your new folder will be called `backend/apps/base-system/src/api/somewhat-module`. If this folder exists, you can skip this step.
2. Create two folders: `dto` and `rest`. `dto` is the place let you define your API structure, or any data objects that you may be used in your action. `rest` is the place for you define the controller, how it should behave. The new folder will be called `backend/apps/base-system/src/api/somewhat-module/dto`, and `backend/apps/base-system/src/api/somewhat-module/rest` respectively. If these folders exist, you can skip this step.
3. Navigate to `backend/apps/base-system/src/lib/bounded-contexts/{your-service-group}/application/service/`, if no such directory, create one. As long as you have a place to define your services.

### 2. Setup Data Transfer Object (DTO)
Navigate to `backend/apps/base-system/src/api/somewhat-module/dto/` to define your data object, including your API request, intermediate data objects, and your responses. The validation rule for your data object in this project can be strengthened by `class-validator`, please refer to https://github.com/typestack/class-validator. To explain the Data Object more precisely, you can use `swagger` library to enhance your description. For example, this is your request object:
```typescript
export class RequestDto {
  @ApiProperty({description: 'This is description for your request parameter, explain it what is this.'})
  @IsOptional()
  @IsString({message: 'Error prompt if non-string value attempt to parse to it.'})
  optionalString?: string;

  @ApiProperty({description: 'This is another description for your request parameter'})
  @IsString({message: 'This parameter must be string'})
  compulsoryString: String;
}
```
In this case, your request will be expected as:

```json
{
  "optionalString": "something optional",
  "compulsoryString": "something compulsory"
}
```
### 3. Setup Services
Navigate to `backend/apps/base-system/src/lib/bounded-contexts/{your-service-group}/application/service/`, create a new file for your services. This is the exact place for you to perform execution/query, whatever, any operations that yield outputs. For each service, it should have such structure/pattern:
```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class YourOperationService {
  constructor() {}

  async serviceAction(inputDto: YourInputDto): Promise<YourOutputDto> {
    console.log('inputDto', inputDto);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return new YourOutputDto();
  }
}
```
These service actions will be used in next step, the controller part.

### 4. Setup Controller
Navigate to `backend/apps/base-system/src/api/somewhat-module/rest/` to define your controller. If the particular controller is not created yet, please create a new controller, else, append it. For each controller, it should have such a structure/pattern:

```typescript
import {Controller} from "@nestjs/common";
import {FastifyRequest} from "fastify";

@Controller('example')
export class ExampleController {

  constructor(private readonly requiredService: RequiredService) {}

  @Public()
  @Post('your-example-action')
  async exampleAction(
    @Body() inputParams: RequestDto,
    @Request() request: FastifyRequest,
  ): Promise<ApiRes<ResponseDto>> {
    console.log('This is your inputParams', inputParams);
    const processedInput = processInput(inputParams);
    const actionOutcome = await requiredService.doAction(processedInput);
    console.log('This is your action outcome', actionOutcome);
    const finalOutput = processOutput(actionOutcome);
    return ApiRes.success(finalOutput);
  }
}
```
In controller, you should import DTOs you declared previously under that module, and necessary services that you declared previously.

In this example, this is a POST API, with endpoint `/example/your-example-action`, expected to receive `RequestDto`, and return a `responseDto`

### 5. Register Modules
Navigate to `backend/apps/base-system/src/lib/bounded-contexts/{your-service-group}/`, create a new file, assumed as `your-service-module.module.ts`. This file should include your services:

```typescript
import {Provider} from "@nestjs/common";

@Module({})
export class YourServiceModule {
  static register(options: {
    inject: Provider[];
    imports: any[];
  }): DynamicModule {
    return {
      module: YourServiceModule,
      imports: [...options.imports],
      providers: [YourServices, ...options.inject],
      exports: [YourServices]
    }
  }
}
```
Then, navigate to `backend/apps/base-system/src/infra/bounded-contexts/{your-service-group}/module.infra.module.ts`, Create or update your infra module. It will be like this:
```typescript
import {Module} from '@nestjs/common';
import {YourServiceModule} from 'somewhere';

@Module({
  imports: [
    YourServiceModule.register({
      inject: [],
      imports: [],
    })
  ], exports: [YourServiceModule],
})
export class YourServiceInfraModule {}
```
This module will be used in the next step, register controller.

### 6. Register Controller
Navigate to `backend/apps/base-system/src/api/somewhat-module/rest`, create a new file called `index.ts`. Neglect this step if the index.ts exist.
This is the expected `index.ts` file:
```typescript
export const Controllers = [
  SomePreviouslyExistedControllers,
  YourNewAddedController
]
```
Then, if you created the new file (new module), navigate to `backend/apps/base-system/src/api/api.module.ts`, you need to 'register' your newly added controllers to the API module. It should be:
```typescript
//api.module.ts
import { Controllers as YourNewModuleRest } from './somewhat-module/rest';

@Module({
  imports: [
    ExistedImportedInfraModules,
    YourNewlyAddedInfraModules
  ],
  controllers: [
    ...AllPreviouslyExistedRestedControllers,
    ...YourAddedResController
  ]
})

```

### 7. Test your API.
Navigate to `backend/.http/`, create a new file for your http test. For example `my-test.http`
In this file, it should have some simple test case:
```html
@host={your_API_host}

#name Tag your test case
POST {{host}}/v1/example/your-example-action
Content-Type: application/json

{
  "testingParams": "Params",
  "anotherTestingParams": "Another params"
}
```
Execute `npm run dev` to start your backend service, then run your test case to verify it.
