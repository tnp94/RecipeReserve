export default class Ingredient {
  name
  unit
  quantityUnit
  category

  constructor(name, unit, quantityUnit, category) {
    this.name = name;
    this.unit = unit;
    this.quantityUnit = quantityUnit;
    this.category = category;
  }
}