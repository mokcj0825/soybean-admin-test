import { randomValueGenerator } from '../../../../test-utility/random-value-generator';

export class FirstOutputDTO {
  constructor(
    public readonly stringOutput: string,
    public readonly numberOutput: number,
    public readonly booleanOutput: boolean,
    public readonly dateOutput: Date,
    public readonly arrayOutput: string[],
    public readonly objectOutput: NestedFirstOutputDTO,
  ) {}

  static generateInstance(): FirstOutputDTO {
    return new FirstOutputDTO(
      randomValueGenerator('string'),
      randomValueGenerator('number'),
      randomValueGenerator('boolean'),
      randomValueGenerator('date'),
      randomValueGenerator('stringArray'),
      NestedFirstOutputDTO.generateInstance())
  }
}

export class NestedFirstOutputDTO {
  constructor(
    public readonly stringOutput: string,
    public readonly numberOutput: number,
    public readonly booleanOutput: boolean,
    public readonly dateOutput: Date,
    public readonly arrayOutput: string[],
  ) {}

  static generateInstance(): NestedFirstOutputDTO {
    return new NestedFirstOutputDTO(
      randomValueGenerator('string'),
      randomValueGenerator('number'),
      randomValueGenerator('boolean'),
      randomValueGenerator('date'),
      randomValueGenerator('stringArray'),
    );
  }
}
