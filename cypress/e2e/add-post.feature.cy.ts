describe('add post feature', () => {
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
    cy.get('[data-cy="open-create-post-modal-button"]').click();
    cy.findByLabelText('Enter post name').type('Post 2', { force: true }); // TOFIX temporary force due to scroll issue
    cy.findByLabelText('Enter post description').type(
      'Some description for Post 2'
    );
    cy.findByText('Confirm').click();
    cy.findByRole('list')
      .findAllByRole('listitem')
      .should('have.length', 2)
      .eq(1)
      .contains('Post 2');
  });
});
