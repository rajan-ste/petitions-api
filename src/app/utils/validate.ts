import Ajv from 'ajv';
const ajv = new Ajv({ removeAdditional: 'all', strict: false });

const validate = async (schema: object, data: any) => {
  try {
    const validator = ajv.compile(schema);
    const valid = await validator(data);
    if (!valid) {
      return ajv.errorsText(validator.errors);
    }
    return true;
  } catch (err) {
    return err.message;
  }
};

function isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

const validGetAllPetitionsParams = (startIndex: string, count: string, supportingCost: string,
                                    ownerId: string, supporterId: string): boolean => {
  let validParams = true;

  if (startIndex && isNaN(parseInt(startIndex, 10))) {
      validParams = false;
  }
  if (count && isNaN(parseInt(count, 10))) {
      validParams = false;
  }
  if (supportingCost && isNaN(parseInt(supportingCost, 10))) {
      validParams = false;
  }
  if (ownerId && isNaN(parseInt(ownerId, 10))) {
      validParams = false;
  }
  if (supporterId && isNaN(parseInt(supporterId, 10))) {
      validParams = false;
  }

  return validParams;
}
export {validate, isValidEmail, validGetAllPetitionsParams}
