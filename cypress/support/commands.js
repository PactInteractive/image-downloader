// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// https://github.com/facebook/react/issues/11488#issuecomment-347775628
Cypress.Commands.add('reactTrigger', { prevSubject: 'element' }, (subject, eventName) => {
  for (const input of subject) {
    const previousValue = input.value;
    input.value = '#000000';

    const $event = new Event('change', { bubbles: true });
    $event.simulated = true;
    const tracker = input._valueTracker;
    if (tracker) {
      tracker.setValue(input);
    }
    input.dispatchEvent($event);
  }
});

Cypress.Commands.add('setValue', { prevSubject: 'element' }, (subject, value) => {
  cy.wrap(subject).invoke('val', value).reactTrigger('change');
});
