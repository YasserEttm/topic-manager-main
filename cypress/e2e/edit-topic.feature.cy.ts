describe('edit topic feature', () => {
  it('passes', () => {
    cy.visit('http://localhost:8100/');

    cy.findByRole('list')
      .findAllByRole('listitem')
      .should('have.length', 2)
      .eq(0)
      .contains('Topic 1');

    cy.findByRole('list')
      .findAllByRole('listitem')
      .should('have.length', 2)
      .eq(0)
      .find('[data-cy="open-topic-management-popover"]')
      .click();

    cy.findByRole('list')
      .findAllByRole('listitem')
      .should('have.length', 2)
      .eq(0)
      .contains('Edit')
      .click();

    cy.findByLabelText('Enter topic name').clear().type('Topic 3');
    cy.findByText('Confirm').click();

    cy.findByRole('list')
      .findAllByRole('listitem')
      .should('have.length', 2)
      .eq(0)
      .contains('Topic 3');
  });
});
