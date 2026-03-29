import { ExternalLink } from '../components/ExternalLink.js';
import html from '../html.js';

const numberOfActiveUsers = '1,900,000+';
const years = new Date().getFullYear() - 2012;

export function About() {
	return html`
    <h1 class="flex justify-center items-center gap-2 mb-8 text-2xl font-bold">
      <img class="rounded-xl h-8" src="/images/logo.svg" />
      Image Downloader
      <small class="text-slate-400">v${chrome.runtime.getManifest().version}</small>
    </h1>

    <a class="float-right mb-4 ml-4 text-center" href="https://x.com/vdsabev" target="_blank" rel="noopener noreferrer">
      <img
        class="w-32 h-32 shadow rounded-[3rem] mb-1"
        src="/images/me.jpg"
      />
      <span class="text-slate-700">Made by</span> @vdsabev
      <br />
      <small class="text-slate-500">(🐕 with Ruby's help)</small>
    </a>

    <p>
      If you're one of the ${numberOfActiveUsers} people using this extension,
      over the past <b class="text-nowrap">${years} years</b> marketing companies
      have approached us with offers to pay in exchange for <b>your private data</b> like:
    </p>

    <ul class="list-disc ml-8">
      <li>what websites you visit</li>
      <li>when you visit them</li>
      <li>where you visit them from</li>
    </ul>

    <p>
      Our response to such offers will always be a resounding <b>NO</b>!
    </p>

    <p>
      The extension will remain <b>free</b>, <b>open-source</b>, and
      <b> without targeted ads or tracking algorithms</b>.
      The source code can be found on GitHub:${' '}
      <${ExternalLink}
        href="https://github.com/PactInteractive/image-downloader"
      />
    </p>

    <p>
      We have other paid products you can use - our premium
      service <${ExternalLink} class="font-bold text-nowrap" href="https://cutoutmagic.com">Cutout Magic</a> can
      identify objects, clear obstructions, or remove background instantly with 1 click!
    </p>

    <p>
      Try it now at <${ExternalLink} class="font-bold text-nowrap" href="https://cutoutmagic.com">cutoutmagic.com</a> -
      free to start, no credit card needed!
    </p>

    <${ExternalLink} href="https://cutoutmagic.com">
      <img class="shadow rounded-2xl" src="https://cutoutmagic.com/cover-1280x720.jpg" />
    <//>

    <p class="mt-8 mb-4">
      You can also try our other projects or support us directly by donating on Gumroad:
    </p>

    <div class="grid grid-cols-2 gap-4">
      <${Project}
        class="flex flex-col"
        href="https://vdsabev.gumroad.com/l/image-downloader"
        src="/images/gumroad.png"
        title="Gumroad page"
        subtitle="Support Image Downloader on Gumroad"
      >
        <img class="flex-1" src="/images/gumroad.svg" />
      <//>

      <${Project}
        href="https://slidezones.com"
        src="https://slidezones.com/images/logo.svg"
        title="SlideZones"
        subtitle="Time zone converter for seamless meetings"
      >
        <img class="flex-1 shadow rounded-2xl" src="https://slidezones.com/images/screenshot.png" />
      <//>

      <${Project}
        href="https://codebedder.com"
        src="https://codebedder.com/logo.svg"
        title="CodeBedder.com"
        subtitle="Simplest code editor on the web"
      >
        <img class="flex-1 shadow rounded-2xl" src="https://codebedder.com/screenshot.png" />
      <//>

      <${Project}
        class="flex flex-col"
        href="https://chrome.google.com/webstore/detail/code-blue/mbjgnjfkngoogkgohnmbimnpdacdbghb"
        src="https://raw.githubusercontent.com/vdsabev/code-blue/master/images/icon_128.png"
        title="Code Blue"
        subtitle="Render blocks of inline code on X/Twitter"
      >
        <div class="flex-1 overflow-hidden grid grid-cols-2 items-center shadow rounded-2xl bg-black">
          <img src="https://raw.githubusercontent.com/vdsabev/code-blue/master/images/before.png" />
          <img src="https://raw.githubusercontent.com/vdsabev/code-blue/master/images/demo.gif" />
        </div>
      <//>
    </div>
  `;
}

function Project({ href, src, title, subtitle, children, ...props }) {
	return html`
		<${ExternalLink} href=${href} ...${props}>
			<div>
				<h2 class="flex items-center gap-1 font-bold">
					<img class="h-5" src=${src} />
					${title}
				</h2>
				<small>${subtitle}</small>
			</div>

			${children}
		<//>
	`;
}
