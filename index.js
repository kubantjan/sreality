const puppeteer = require('puppeteer');
const fs = require('fs-extra');

process.on('unhandledRejection', error => {
    throw error;
});

void async function () {
    if (!process.argv[2]) {
        console.log('Pass the URL of the search results page as an argument, please.');
        process.exit(1);
    }

    const browser = await puppeteer.launch();
    try {
        const [page] = await browser.pages();
        await evade(page);

        const today = new Date();
        const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

        const data_folder = '/home/honza/google-drive/Kmen/Nemovitosti/VelkeNemovitostiPronajmy/data-' + date
        if (fs.existsSync(data_folder)) {
            fs.rmdirSync(data_folder, {recursive: true}, function (err) {
                if (err) {
                    console.log('Failed to delete directory', err);
                } else
                    console.log("Deleted folder")
            });
        }
        if (!fs.existsSync(data_folder)) {
            fs.mkdirSync(data_folder, function (err) {
                if (err) {
                    console.log('Failed to create directory', err);
                } else
                    console.log("Created folder")
            });
        }

        console.log('Going to the search result page');
        await page.goto(process.argv[2]);

        const hrefs = await page.$$eval('a.title[href^="/detail/"]', as => as.map(a => a.href));
        console.log(`Found ${hrefs.length} post links on the page`);

        for (const href of hrefs) {
            const page = await browser.newPage();
            await evade(page);

            console.log(`Going to the post link href: ${href}`);
            await page.goto(href);

            // Wait for each element first to make sure it has been rendered using JS
            const [id] = href.split('/').slice(-1);
            await page.waitForSelector('div.property-title span.name');
            const title = await page.$eval('div.property-title span.name', span => span.textContent);
            await page.waitForSelector('span.location-text');
            const location = await page.$eval('span.location-text', span => span.textContent);
            await page.waitForSelector('span.norm-price');
            const price = await page.$eval('span.norm-price', span => span.textContent);
            await page.waitForSelector('div.description');
            const description = await page.$eval('div.description', div => div.textContent);
            await page.waitForSelector('button.thumbnails');

            await fs.writeJson(
                data_folder + '/' + id + '.json',
                {id, url: href, title, location, price, description, date},
                {spaces: 2}
            );

            // console.log('Capturing a screenshot of the post page');
            // await page.screenshot({path: data_folder + '/' + id + '.png', fullPage: true});

            await page.close();
        }

        console.log('Captured screenshot of all the posts');
    } finally {
        console.log('Closing the browser');
        await browser.close();
    }
}()

// https://github.com/paulirish/headless-cat-n-mouse/blob/master/apply-evasions.js
async function evade(page) {
    // Pass the User-Agent Test.
    const userAgent =
        'Mozilla/5.0 (X11; Linux x86_64)' +
        'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36';
    await page.setUserAgent(userAgent);

    // Pass the Webdriver Test.
    await page.evaluateOnNewDocument(() => {
        const newProto = navigator.__proto__;
        delete newProto.webdriver;
        navigator.__proto__ = newProto;
    });

    // Pass the Chrome Test.
    await page.evaluateOnNewDocument(() => {
        // We can mock this in as much depth as we need for the test.
        window.chrome = {
            runtime: {}
        };
    });

    // Pass the Permissions Test.
    await page.evaluateOnNewDocument(() => {
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.__proto__.query = parameters =>
            parameters.name === 'notifications'
                ? Promise.resolve({state: Notification.permission})
                : originalQuery(parameters);

        // Inspired by: https://github.com/ikarienator/phantomjs_hide_and_seek/blob/master/5.spoofFunctionBind.js
        const oldCall = Function.prototype.call;

        function call() {
            return oldCall.apply(this, arguments);
        }

        Function.prototype.call = call;

        const nativeToStringFunctionString = Error.toString().replace(/Error/g, "toString");
        const oldToString = Function.prototype.toString;

        function functionToString() {
            if (this === window.navigator.permissions.query) {
                return "function query() { [native code] }";
            }
            if (this === functionToString) {
                return nativeToStringFunctionString;
            }
            return oldCall.call(oldToString, this);
        }

        Function.prototype.toString = functionToString;
    });

    // Pass the Plugins Length Test.
    await page.evaluateOnNewDocument(() => {
        // Overwrite the `plugins` property to use a custom getter.
        Object.defineProperty(navigator, 'plugins', {
            // This just needs to have `length > 0` for the current test,
            // but we could mock the plugins too if necessary.
            get: () => [1, 2, 3, 4, 5]
        });
    });

    // Pass the Languages Test.
    await page.evaluateOnNewDocument(() => {
        // Overwrite the `languages` property to use a custom getter.
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en']
        });
    });

    // Pass the iframe Test
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
            get: function () {
                return window;
            }
        });
    });

    // Pass toString test, though it breaks console.debug() from working
    await page.evaluateOnNewDocument(() => {
        window.console.debug = () => {
            return null;
        };
    });
}
