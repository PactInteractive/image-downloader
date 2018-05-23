declare namespace Cypress {
  interface Chainable<Subject = any> {
    reactTrigger(eventName: string): Chainable<Subject>;
    setValue(value: string): Chainable<Subject>;
  }
}
