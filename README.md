# SReality

Scraping SReality with Puppeteer.

## Usage

`npm start ${url}`

`${url}` is the URL of the search results page. E.g. all houses in Prague:

`https://www.sreality.cz/hledani/prodej/domy?region=Praha&vzdalenost=0.5`

When using PowerShell, use triple quotes to escape everything in the URL right:
`npm start """${url}"""`

## Limitations

Note that SReality does not show the post creation date, only the modification
date and this scraper does not capture either. If you want to track post age,
run this script daily and keep track of which posts appear and disappear
yourself.

At this time, this scraper only scrapes the posts on the provided search results
page URL, but doesn't not automatically advance to further pages. I have plans
to add this.

## To-Do

### Implement paging the search results


Currently running with  npm start 'https://www.sreality.cz/hledani/pronajem/domy/praha-zapad,praha-vychod,praha-1,praha-2,praha-3,praha-4,praha-7,praha-6,praha-5,praha-8,praha-9,praha-10?velikost=5-a-vice,atypicky&plocha-od=300&plocha-do=10000000000&cena-od=0&cena-do=86000'
