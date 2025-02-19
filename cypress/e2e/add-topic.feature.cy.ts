describe('add topic feature', () => {
  it('passes', () => {
    cy.visit('http://localhost:8100/');
    cy.findByRole('list')
      .findAllByRole('listitem')
      .should('have.length', 2)
      .eq(0)
      .contains('Topic 1');
    cy.get('[data-cy="open-create-topic-modal-button"]').click();
    cy.findByLabelText('Enter topic name').type('Topic 3');
    cy.findByText('Confirm').click();
    cy.findByRole('list')
      .findAllByRole('listitem')
      .should('have.length', 3)
      .eq(2)
      .contains('Topic 3');
  });
});
