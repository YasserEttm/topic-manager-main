describe('delete topic feature', () => {
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
      .eq(1)
      .contains('Delete')
      .click();

    cy.findByRole('list')
      .findAllByRole('listitem')
      .should('have.length', 1)
      .eq(0)
      .contains('Topic 2');
  });
});
