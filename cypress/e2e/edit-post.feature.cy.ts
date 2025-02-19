describe('edit post feature', () => {
  it('passes', () => {
    cy.visit('http://localhost:8100/');

    cy.findByRole('list')
      .findAllByRole('listitem')
      .should('have.length', 2)
      .eq(0)
      .contains('Topic 1')
      .click();

    cy.findByRole('list')
      .findAllByRole('listitem')
      .should('have.length', 1)
      .eq(0)
      .contains('Post 1');

    cy.findByRole('list')
      .findAllByRole('listitem')
      .should('have.length', 1)
      .eq(0)
      .find('[data-cy="open-post-management-popover"]')
      .click();

    cy.findByRole('list')
      .findAllByRole('listitem')
      .should('have.length', 2)
      .eq(0)
      .contains('Edit')
      .click();

    cy.findByLabelText('Enter post name')
      .clear({ force: true }) // TOFIX temporary force due to scroll issue
      .type('Post 2', { force: true }); // TOFIX temporary force due to scroll issue
    cy.findByText('Confirm').click();

    cy.findByRole('list')
      .findAllByRole('listitem')
      .should('have.length', 1)
      .eq(0)
      .contains('Post 2');
  });
});
