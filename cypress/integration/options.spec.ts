/// <reference path="../types.d.ts" />

import { Options } from '../../src/options/Options';
import * as $ from '../mappings';

describe(`Options`, () => {
  const options = new Options();
  const beCheckedIf = (checked: boolean) => (checked ? 'be.checked' : 'not.be.checked');

  const updateOptions = () => {
    // General
    cy.get($.show_download_confirmation).click();
    cy.get($.show_download_notification).click();
    cy.get($.show_file_renaming).click();

    // Filters
    cy.get($.show_url_filter).click();
    cy.get($.show_image_width_filter).click();
    cy.get($.show_image_height_filter).click();
    cy.get($.show_only_images_from_links).click();

    // Images
    cy.get($.show_image_url).click();
    cy.get($.show_open_image_button).click();
    cy.get($.show_download_image_button).click();

    cy.get($.columns).type('{selectall}').type('3');
    cy.get($.image_min_width).type('{selectall}').type('100');
    cy.get($.image_max_width).type('{selectall}').type('300');
    cy.get($.image_border_width).type('{selectall}').type('5');
    cy.get($.image_border_color).setValue('#000000');
  };

  const optionsShouldBeDefault = () => {
    // General
    cy.get($.show_download_confirmation).should(beCheckedIf(options.show_download_confirmation));
    cy.get($.show_download_notification).should(beCheckedIf(options.show_download_notification));
    cy.get($.show_file_renaming).should(beCheckedIf(options.show_file_renaming));

    // Filters
    cy.get($.show_url_filter).should(beCheckedIf(options.show_url_filter));
    cy.get($.show_image_width_filter).should(beCheckedIf(options.show_image_width_filter));
    cy.get($.show_image_height_filter).should(beCheckedIf(options.show_image_height_filter));
    cy.get($.show_only_images_from_links).should(beCheckedIf(options.show_only_images_from_links));

    // Images
    cy.get($.show_image_url).should(beCheckedIf(options.show_image_url));
    cy.get($.show_open_image_button).should(beCheckedIf(options.show_open_image_button));
    cy.get($.show_download_image_button).should(beCheckedIf(options.show_download_image_button));

    cy.get($.columns).should('have.value', options.columns.toString());
    cy.get($.image_min_width).should('have.value', options.image_min_width.toString());
    cy.get($.image_max_width).should('have.value', options.image_max_width.toString());
    cy.get($.image_border_width).should('have.value', options.image_border_width.toString());
    cy.get($.image_border_color).should('have.value', options.image_border_color);
  };

  const optionsShouldBeUpdated = () => {
    // General
    cy.get($.show_download_confirmation).should(beCheckedIf(!options.show_download_confirmation));
    cy.get($.show_download_notification).should(beCheckedIf(!options.show_download_notification));
    cy.get($.show_file_renaming).should(beCheckedIf(!options.show_file_renaming));

    // Filters
    cy.get($.show_url_filter).should(beCheckedIf(!options.show_url_filter));
    cy.get($.show_image_width_filter).should(beCheckedIf(!options.show_image_width_filter));
    cy.get($.show_image_height_filter).should(beCheckedIf(!options.show_image_height_filter));
    cy.get($.show_only_images_from_links).should(beCheckedIf(!options.show_only_images_from_links));

    // Images
    cy.get($.show_image_url).should(beCheckedIf(!options.show_image_url));
    cy.get($.show_open_image_button).should(beCheckedIf(!options.show_open_image_button));
    cy.get($.show_download_image_button).should(beCheckedIf(!options.show_download_image_button));

    cy.get($.columns).should('have.value', '3');
    cy.get($.image_min_width).should('have.value', '100');
    cy.get($.image_max_width).should('have.value', '300');
    cy.get($.image_border_width).should('have.value', '5');
    cy.get($.image_border_color).should('have.value', '#000000');
  };

  beforeEach(() => {
    cy.visit('/');
  });

  it(`should have the correct title`, () => {
    cy.title().should('eq', 'Image Downloader | Options');
  });

  it(`should save options`, () => {
    updateOptions();
    cy.get($.save).click();
    cy.reload();
    optionsShouldBeUpdated();
  });

  it(`should reset options`, () => {
    updateOptions();
    cy.get($.reset).click();
    cy.reload();
    optionsShouldBeDefault();
  });

  it(`should clear options`, () => {
    updateOptions();
    cy.get($.save).click();
    cy.reload();
    cy.get($.clear).click();
    optionsShouldBeDefault();
  });
});
