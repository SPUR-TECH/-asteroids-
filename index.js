const canvas = document.querySelector('canvas')

const c = canvas.getContext('2d')

const scoreEl = document.querySelector('#scoreEl')
const modalEl = document.querySelector('#modalEl')
const modalScoreEl = document.querySelector('#modalScoreEl')
const buttonEl = document.querySelector('#buttonEl')
const startButtonEl = document.querySelector('#startButtonEl')
const startModalEl = document.querySelector('#startModalEl')

canvas.width = innerWidth
canvas.height = innerHeight



const x = canvas.width / 2
const y = canvas.height / 2

let player = new Player(x, y, 10, 'white')
let projectiles = []
let enemies = []
let particles = []
let animationId
let intervalId
let score = 0
let powerUps = []
let frames = 0
let game = {
    active: false
}

function init() {
    player = new Player(x, y, 10, 'white')
    projectiles = []
    enemies = []
    particles = []
    powerUps = []
    animationId
    score = 0
    scoreEl.innerHTML = 0
    frames = 0
    game = {
        active: true
    }
}

function spawnEnemies() {
    intervalId = setInterval(() => {
        const radius = Math.random() * (50 - 8) + 8

        let x
        let y

        if (Math.random() > 0.5) {
            x = Math.random() > .5 ? 0 - radius : canvas.width + radius
            y = Math.random() * canvas.height

        } else {
            x = Math.random() * canvas.width
            y = Math.random() > .5 ? 0 - radius : canvas.height + radius
        }

        const color = `hsl(${Math.random() * 360}, 50%, 50%)`
        const angle = Math.atan2(
            canvas.height / 2 - y,
            canvas.width / 2 - x
        )
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }

        enemies.push(new Enemy(x, y, radius, color, velocity))
    }, 2000)
}

function spawnPowerUps() {
    if (game.active) {
        spawnPowerUps = setInterval(() => {
            // audio.throb.play()
            powerUps.push(
                new PowerUp({
                    position: {
                        x: -30,
                        y: Math.random() * canvas.height
                    },
                    velocity: {
                        x: Math.random() + 2,
                        y: 0
                    }
                })
            )
        }, 10000)
    }
}

function createScoreLabel({
    position,
    score
}) {
    const scoreLabel = document.createElement('label')
    scoreLabel.innerHTML = score
    scoreLabel.style.color = 'yellow'
    scoreLabel.style.position = 'absolute'
    scoreLabel.style.left = position.x + 'px'
    scoreLabel.style.top = position.y + 'px'
    scoreLabel.style.userSelect = 'none'
    scoreLabel.style.fontSize = 30
    document.body.appendChild(scoreLabel)

    gsap.to(scoreLabel, {
        opacity: 0,
        y: -50,
        duration: 1.5,
        onComplete: () => {
            scoreLabel.parentNode.removeChild(scoreLabel)
        }
    })
}

function animate() {
    animationId = requestAnimationFrame(animate)
    c.fillStyle = 'rgba(0,0,0,0.1)'
    c.fillRect(0, 0, canvas.width, canvas.height)

    frames++

    player.update()

    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i]

        if (powerUp.position.x > canvas.width) {
            powerUps.splice(i, 1)
        } else powerUp.update()

        const dist = Math.hypot(
            player.x - powerUp.position.x,
            player.y - powerUp.position.y
        )

        // Gain power up
        if (dist < powerUp.image.height / 2 + player.radius) {
            audio.powerUpNoise.play()
            powerUps.splice(i, 1)
            player.powerUp = 'MachineGun'
            player.color = 'yellow'
            audio.throb.stop()

            // power up runs out
            setTimeout(() => {
                player.powerUp = null
                player.color = 'white'
            }, 5000)
        }
    }


    // Machine gun animation / implementation
    if (player.powerUp === 'MachineGun') {
        const angle = Math.atan2(
            mouse.position.y - player.y,
            mouse.position.x - player.x
        )
        const velocity = {
            x: Math.cos(angle) * 5,
            y: Math.sin(angle) * 5
        }

        if (frames % 2 === 0) {
            projectiles.push(
                new Projectile(player.x, player.y, 5, 'yellow', velocity)
            )
        }

        if (frames % 6 === 0) {
            audio.shoot.play()
        }
    }

    for (let index = particles.length - 1; index >= 0; index--) {
        const particle = particles[index]
        if (particle.alpha <= 0) {
            particles.splice(index, 1)
        } else {
            particle.update()
        }
    }

    for (let index = projectiles.length - 1; index >= 0; index--) {
        const projectile = projectiles[index]

        projectile.update()
        // Remove projectiles when off screen
        if (
            projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height) {
            setTimeout(() => {
                projectiles.splice(index, 1)
            }, 0)
        }
    }

    for (let index = enemies.length - 1; index >= 0; index--) {
        const enemy = enemies[index]
        enemy.update()

        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y)

        // End Game
        if (dist - enemy.radius - player.radius < 1) {
            audio.throb.stop()
            audio.start.stop()
            cancelAnimationFrame(animationId)
            clearInterval(intervalId)
            audio.death.play()
            game.active = false
            audio.throb.stop()
            modalEl.style.display = 'block'
            gsap.fromTo(
                '#modalEl', {
                    scale: 0.8,
                    opacity: 0
                }, {
                    scale: 1,
                    opacity: 1,
                    ease: 'expo'
                }
            )
            modalScoreEl.innerHTML = score
        }

        for (
            let projectilesIndex = projectiles.length - 1; projectilesIndex >= 0; projectilesIndex--
        ) {
            const projectile = projectiles[projectilesIndex]

            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y)

            // Projectiles touch enemy
            if (dist - enemy.radius - projectile.radius < 1) {


                // Create explosions
                for (let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(new Particle(projectile.x, projectile.y, Math.random() * 2, enemy.color, {
                        x: (Math.random() - 0.5) * (Math.random() * 6),
                        y: (Math.random() - 0.5) * (Math.random() * 6)
                    }))
                }

                // Shrink enemy
                if (enemy.radius - 10 > 7) {
                    audio.damageTaken.play()
                    score += 100
                    scoreEl.innerHTML = score

                    gsap.to(enemy, {
                        radius: enemy.radius - 10
                    })
                    createScoreLabel({
                        position: {
                            x: projectile.x,
                            y: projectile.y
                        },
                        score: 100
                    })
                    projectiles.splice(projectilesIndex, 1)
                } else {
                    // Remove enemy
                    score += 150
                    audio.explode.play()
                    scoreEl.innerHTML = score
                    createScoreLabel({
                        position: {
                            x: projectile.x,
                            y: projectile.y
                        },
                        score: 150
                    })

                    enemies.splice(index, 1)
                    projectiles.splice(projectilesIndex, 1)
                }
            }
        }
    }
}

addEventListener('click', (event) => {
    if (game.active) {
        const angle = Math.atan2(event.clientY - player.y, event.clientX - player.x)
        const velocity = {
            x: Math.cos(angle) * 5,
            y: Math.sin(angle) * 5
        }
        projectiles.push(new Projectile(player.x, player.y, 5, 'white', velocity))

        audio.shoot.play()

    }
})

addEventListener('touch', (event) => {
    event.preventDefault()
    const angle = Math.atan2(event.clientY - player.y, event.clientX - player.x)
    const velocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5
    }
    projectiles.push(new Projectile(player.x, player.y, 5, 'white', velocity))
})

const mouse = {
    position: {
        x: 0,
        y: 0
    }
}
addEventListener('mousemove', (event) => {
    mouse.position.x = event.clientX
    mouse.position.y = event.clientY
})

// Restart game
buttonEl.addEventListener('click', () => {
    audio.select.play()
    audio.start.play()
    init()
    animate()
    spawnEnemies()
    spawnPowerUps()
    gsap.to('#modalEl', {
        opacity: 0,
        scale: 0,
        duration: 0.65,
        ease: 'expo.in',
        onComplete: () => {
            modalEl.style.display = 'none'
        }
    })
})

// Start game

startModalEl.addEventListener('click', () => {
    audio.select.play()
    audio.start.play()
    init()
    animate()
    spawnEnemies()
    spawnPowerUps()
    gsap.to('#startModalEl', {
        opacity: 0,
        scale: 0,
        duration: 0.65,
        rotate: 720,
        ease: 'expo.in',
        onComplete: () => {
            startModalEl.style.display = 'none'
        }
    })
})

addEventListener('keydown', (event) => {
    console.log(event.key)
    switch (event.key) {
        case 'ArrowRight':
            player.velocity.x += 1
            break
        case 'ArrowUp':
            player.velocity.y -= 1
            break
        case 'ArrowLeft':
            player.velocity.x -= 1
            break
        case 'ArrowDown':
            player.velocity.y += 1
            break
    }
})