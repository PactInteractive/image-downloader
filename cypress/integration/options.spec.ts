import { Options } from '../../src/options/Options';

describe(`Options`, () => {
  const options = new Options();
  const beCheckedIf = (checked: boolean) => (checked ? 'be.checked' : 'not.be.checked');

  beforeEach(() => {
    cy.visit('/');
  });

  it(`should have the correct title`, () => {
    cy.title().should('eq', 'Image Downloader | Options');
  });

  it(`should load default general options`, () => {
    cy.get('[data-test="show_download_confirmation"]').should(beCheckedIf(options.show_download_confirmation));
    cy.get('[data-test="show_download_notification"]').should(beCheckedIf(options.show_download_notification));
    cy.get('[data-test="show_file_renaming"]').should(beCheckedIf(options.show_file_renaming));
  });

  it(`should load default filter options`, () => {
    cy.get('[data-test="show_url_filter"]').should(beCheckedIf(options.show_url_filter));
    cy.get('[data-test="show_image_width_filter"]').should(beCheckedIf(options.show_image_width_filter));
    cy.get('[data-test="show_image_height_filter"]').should(beCheckedIf(options.show_image_height_filter));
    cy.get('[data-test="show_only_images_from_links"]').should(beCheckedIf(options.show_only_images_from_links));
  });

  it(`should load default image options`, () => {
    cy.get('[data-test="show_image_url"]').should(beCheckedIf(options.show_image_url));
    cy.get('[data-test="show_open_image_button"]').should(beCheckedIf(options.show_open_image_button));
    cy.get('[data-test="show_download_image_button"]').should(beCheckedIf(options.show_download_image_button));

    cy.get('[data-test="columns"]').should('have.value', options.columns.toString());
    cy.get('[data-test="image_min_width"]').should('have.value', options.image_min_width.toString());
    cy.get('[data-test="image_max_width"]').should('have.value', options.image_max_width.toString());
    cy.get('[data-test="image_border_width"]').should('have.value', options.image_border_width.toString());
    cy.get('[data-test="image_border_color"]').should('have.value', options.image_border_color);
  });
});
