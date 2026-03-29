import html from '../html.js';
import { ExternalLink } from '../components/ExternalLink.js';

export const Support = () => html`
  <p>
    <i>This extension is free!</i> We have other paid products you can use - our premium
    service <${ExternalLink} class="font-bold text-nowrap" href="https://cutoutmagic.com">Cutout Magic</a> can
    identify objects, clear obstructions, or remove background instantly with 1 click!
  </p>

  <p>
    Try it now at <${ExternalLink} class="font-bold text-nowrap" href="https://cutoutmagic.com">cutoutmagic.com</a> -
    free to start, no credit card needed
  </p>

  <${ExternalLink} href="https://cutoutmagic.com">
    <img class="shadow rounded-2xl" src="https://cutoutmagic.com/cover-1280x720.jpg" />
  <//>

  <p class="mt-8 mb-4">
    You can also try our other projects or support us directly by donating on Gumroad:
  </p>

  <div class="grid grid-cols-2 gap-4">
    <${ExternalLink} href="https://slidezones.com">
      <h2 class="inline-flex items-center gap-1 font-bold">
        <img class="h-5" src="https://slidezones.com/images/logo.svg" />
        SlideZones
      </h2>
      <br />
      <small>Time zone converter for seamless meetings</small>

      <img class="shadow rounded-2xl" src="https://slidezones.com/images/screenshot.png" />
    <//>

    <${ExternalLink} href="https://codebedder.com">
      <h2 class="inline-flex items-center gap-1 font-bold">
        <img class="h-5" src="https://codebedder.com/logo.svg" />
        CodeBedder.com
      </h2>
      <br />
      <small>Simplest code editor on the web</small>

      <img class="shadow rounded-2xl" src="https://codebedder.com/screenshot.png" />
    <//>

    <${ExternalLink} href="https://chrome.google.com/webstore/detail/code-blue/mbjgnjfkngoogkgohnmbimnpdacdbghb">
      <h2 class="inline-flex items-center gap-1 font-bold">
        <img class="h-5" src="https://raw.githubusercontent.com/vdsabev/code-blue/master/images/icon_128.png" />
        Code Blue
      </h2>
      <br />
      <small>Render blocks of inline code on X/Twitter</small>

      <div class="overflow-hidden shadow rounded-2xl" style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <img
          src="https://raw.githubusercontent.com/vdsabev/code-blue/master/images/before.png"
        />
        <img
          src="https://raw.githubusercontent.com/vdsabev/code-blue/master/images/demo.gif"
        />
      </div>
    <//>

    <${ExternalLink} class="flex flex-col" href="https://vdsabev.gumroad.com/l/image-downloader">
      <div>
        <h2 class="inline-flex items-center gap-1 font-bold">
          <img class="h-5" src="/images/gumroad.png" />
          Gumroad page
        </h2>
        <br />
        <small>Support Image Downloader on Gumroad</small>
      </div>

      <img src="/images/gumroad.svg" style=${{ flex: '1' }} />
    <//>
  </div>
`;
