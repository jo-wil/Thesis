def keystring(s):
    ks = "'"
    for i in range(len(s)):
        if ((i % 40) is 0) and (not (i is 0)):
            ks += "'+\n'"
        ks += s[i]
    ks += "';"
    print ks
    print '\n\n\n'

keystring("eyJjcnYiOiJQLTI1NiIsImQiOiJwUElFSmxSTE16ekJaQVN6Q2hDa1B4ZG52VW9RX2RuZHlDSnZPeVlKOUFRIiwiZXh0Ijp0cnVlLCJrZXlfb3BzIjpbImRlcml2ZUtleSIsImRlcml2ZUJpdHMiXSwia3R5IjoiRUMiLCJ4IjoibC11dEdPNEdyTXA1Ymwzbmp3TGJ2THpzQ1VEQkluWDVOYnRUdGJGYzNQYyIsInkiOiJUTDZuTWpXRWdIdjlJSXhhQm5XUXJERFhyMU92TzZqMnRJNUZSVVdmbHZvIn0=")
keystring("eyJjcnYiOiJQLTI1NiIsImV4dCI6dHJ1ZSwia2V5X29wcyI6W10sImt0eSI6IkVDIiwieCI6ImwtdXRHTzRHck1wNWJsM25qd0xidkx6c0NVREJJblg1TmJ0VHRiRmMzUGMiLCJ5IjoiVEw2bk1qV0VnSHY5SUl4YUJuV1FyRERYcjFPdk82ajJ0STVGUlVXZmx2byJ9")
