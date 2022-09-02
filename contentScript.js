(async () => {
    await fetch("https://www.youtube.com/watch?v=Pv9_ZYNQHxE&hl=en").then(async (res) => {
        return await res.text();
    }).then((data) => {
        console.log(data);
    })
})()