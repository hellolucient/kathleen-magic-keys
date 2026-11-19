import asyncio,json,edge_tts
N=('en-GB-SoniaNeural','-12%','-2Hz'); F=('en-GB-MaisieNeural','-6%','+4Hz')
L={
 'narr-intro':(N,"Once upon a time, in a sparkling pink castle, Princess Kathleen woke up in her beautiful bedroom. The sun was peeking through the curtains... and something magical was about to happen."),
 'narr-fairy-arrives':(N,"Suddenly, with a twinkle and a shimmer, a little fairy appeared!"),
 'fairy-intro':(F,"Oh, Princess Kathleen! The five magic keys have disappeared! Without them, we can't open the castle's enchanted door. Can you help me find them?"),
 'fairy-start':(F,"Let's look all around your room. Tap on things to see what's hiding!"),
 'fairy-found-1':(F,"You found one! Hooray! Four more to go!"),
 'fairy-found-2':(F,"Another magic key! Two keys! You're so clever, Kathleen!"),
 'fairy-found-3':(F,"Three keys! Wow, you're a wonderful explorer! Only two more!"),
 'fairy-found-4':(F,"Four keys! Just one more to find. I know you can do it!"),
 'fairy-found-5':(F,"Five keys! You found them all, Princess Kathleen!"),
 'hint-teddy-1':(F,"I think Teddy is hiding something..."),
 'hint-teddy-2':(F,"Teddy looks a little bit wiggly. Maybe give him a tap?"),
 'hint-teddy-3':(F,"What could be behind Teddy? Let's ask him to move over!"),
 'hint-teddy-4':(F,"Teddy is sitting on something shiny!"),
 'hint-jewellery-1':(F,"Something sparkly is in the jewellery box..."),
 'hint-jewellery-2':(F,"Ooh, the pretty pink box on your dressing table... I wonder what's inside?"),
 'hint-jewellery-3':(F,"Princesses keep their treasures in a jewellery box. Try opening the lid!"),
 'hint-jewellery-4':(F,"I can hear something jingling in the little pink box!"),
 'hint-curtain-1':(F,"The curtains are moving in the breeze..."),
 'hint-curtain-2':(F,"Something is twinkling behind the curtains by the window!"),
 'hint-curtain-3':(F,"Let's open the curtains and let the starlight in!"),
 'hint-curtain-4':(F,"Peek behind the big pink curtains, Kathleen!"),
 'hint-wardrobe-1':(F,"Have you looked inside the wardrobe?"),
 'hint-wardrobe-2':(F,"So many pretty dresses live in your wardrobe... Let's open the doors!"),
 'hint-wardrobe-3':(F,"One of the dresses has a little pocket. What's in it?"),
 'hint-wardrobe-4':(F,"Look closely at the pink dress in the middle!"),
 'hint-mirror-1':(F,"The mirror is twinkling..."),
 'hint-mirror-2':(F,"Magic mirror, magic mirror! Try giving it a tap."),
 'hint-mirror-3':(F,"The mirror is twinkling... tap the stars!"),
 'hint-mirror-4':(F,"Tap the stars one, two, three, from the top to the bottom!"),
 'hint-mirror-5':(F,"Oops, let's try the stars again. Start with the top star!"),
 'hint-general-1':(F,"Keep exploring! Magic keys love to hide."),
 'hint-general-2':(F,"Tap on anything that looks interesting!"),
 'hint-general-3':(F,"Hmm... where haven't we looked yet?"),
 'curious-musicbox':(F,"Ooh, what a lovely song! Look at the little ballerina dance!"),
 'curious-kitten':(F,"Hello, kitty! She wants to play!"),
 'curious-chest':(F,"Your toys are saying hello!"),
 'curious-dragon':(F,"The little dragon is giggling! That tickles!"),
 'curious-chandelier':(F,"Sparkle, sparkle! Isn't it beautiful?"),
 'curious-bed':(F,"What a cosy bed! But no keys under the pillows."),
 'curious-door-locked':(F,"The golden door is locked tight. We need all five magic keys!"),
 'curious-books':(F,"So many storybooks! Maybe we'll read one later."),
 'fairy-door-glow':(F,"Look! The golden door is glowing! Tap the door, Kathleen!"),
 'narr-unlock':(N,"One by one, the five magic keys flew into the golden locks... click, click, click, click, click! And the enchanted door swung open."),
 'fairy-final':(F,"You did it, Princess Kathleen! You're a wonderful treasure hunter! Now our magical adventure can begin!"),
 'narr-complete':(N,"And so, Princess Kathleen and her fairy friend stepped through the glowing door... To be continued!"),
 'narr-title':(N,"Princess Kathleen and the Five Magic Keys. Chapter One: The Princess's Bedroom."),
}
async def main():
    out={}
    for k,((v,r,p),t) in L.items():
        await edge_tts.Communicate(t,v,rate=r,pitch=p).save(f'{k}.mp3')
        out[k]={'text':t,'voice':v,'speaker':'narrator' if v==N[0] else 'fairy','file':f'audio/{k}.mp3'}
    json.dump(out,open('lines.json','w'),indent=1)
asyncio.run(main()); print(len(L))
