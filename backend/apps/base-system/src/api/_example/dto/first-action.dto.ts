import { randomValueGenerator } from '../../../../test-utility/random-value-generator';

export class FirstActionDTO {
  constructor(
    public readonly stringParam: string,
    public readonly numberParam: number,
    public readonly booleanParam: boolean,
    public readonly dateParam: Date,
    public readonly arrayParam: string[],
    public readonly objectParam: NestedFirstActionDTO,
  ) {}

  static generateInstance(): FirstActionDTO {
    return new FirstActionDTO(
      randomValueGenerator('string'),
      randomValueGenerator('number'),
      randomValueGenerator('boolean'),
      randomValueGenerator('date'),
      randomValueGenerator('stringArray'),
      NestedFirstActionDTO.generateInstance())
  }
}

export class NestedFirstActionDTO {
  constructor(
    public readonly stringParam: string,
    public readonly numberParam: number,
    public readonly booleanParam: boolean,
    public readonly dateParam: Date,
    public readonly arrayParam: string[],
  ) {}

  static generateInstance(): NestedFirstActionDTO {
    return new NestedFirstActionDTO(
      randomValueGenerator('string'),
      randomValueGenerator('number'),
      randomValueGenerator('boolean'),
      randomValueGenerator('date'),
      randomValueGenerator('stringArray'),
    );
  }
}
