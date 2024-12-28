const getRandomValue = (min, max) =>
  Math.floor(Math.random() * (max - min)) + min;

const app = Vue.createApp({
  data() {
    return {
      message: ["good", "your turn"],
      warning: "",
      playerHealth: 100,
      monsterHealth: 100,
      roundCount: 1,
      roundToUseSpecialAttack: 5,
      someoneHit: "",
      someoneHealed: "",
      hitTimer: null,
      healTimer: null,
      playerStandby: false,
      isAttackBar: false,
      isAttacking: false,
      isMonsterAttacking: false,
      indicator: 0,
      indicatorNum: 0,
      indicatorTimer: null,
      attckRange: 0,
      attckRangeTimer: null,
      winner: null,
      logs: [],
    };
  },
  computed: {
    monsterHealthBarValue() {
      return { width: `${this.monsterHealth}%` };
    },
    playerHealthBarValue() {
      return { width: `${this.playerHealth}%` };
    },
    canUseSpecialAttack() {
      return this.roundToUseSpecialAttack <= 0;
    },
  },
  watch: {
    playerHealth(value) {
      if (value <= 0) {
        this.playerHealth = 0;
        this.endGame("monster");
      }
    },
    monsterHealth(value) {
      if (value <= 0) {
        this.monsterHealth = 0;
        this.endGame("player");
      }
    },
  },
  methods: {
    newGame() {
      this.message = ["good", "your turn"];
      this.playerHealth = 100;
      this.monsterHealth = 100;
      this.roundCount = 1;
      this.roundToUseSpecialAttack = 5;
      this.someoneHit = "";
      this.someoneHealed = "";
      this.hitTimer = null;
      this.healTimer = null;
      this.playerStandby = false;
      this.isAttackBar = false;
      this.isAttacking = false;
      this.isMonsterAttacking = false;
      this.indicator = 0;
      this.indicatorNum = 0;
      this.indicatorTimer = null;
      this.attckRange = 0;
      this.attckRangeTimer = null;
      this.winner = null;
      this.logs = [];
    },
    endGame(winner) {
      this.winner = winner;
      this.message = ["good", "game ended"];
      this.playerStandby = true;
    },
    nameAction(someone) {
      return {
        heal: this.someoneHealed == someone,
        hit: this.someoneHit == someone,
      };
    },
    hitSomeone(someone) {
      this.someoneHit = someone;
      this.hitTimer = setTimeout(() => {
        this.hitTimer = null;
        this.someoneHit = "";
      }, 1001);
    },
    healSomeone(someone) {
      this.someoneHealed = someone;
      this.healTimer = setTimeout(() => {
        this.healTimer = null;
        this.someoneHealed = "";
      }, 1001);
    },
    monsterAttack() {
      this.hideAttackBar();
      if (!this.winner) {
        this.message = ["bad", "monster turn"];
        this.isMonsterAttacking = true;
        setTimeout(() => {
          const attackValue = getRandomValue(8, 20);
          this.playerHealth -= attackValue;
          this.isMonsterAttacking = false;
          this.playerStandby = false;
          this.hitSomeone("player");
          this.roundCount++;
          this.roundToUseSpecialAttack--;
          this.message = ["good", "your turn"];
          this.addLogMessage("monster", "attack", attackValue);
        }, 1500);
      }
    },
    healPlayer() {
      const healValue = getRandomValue(15, 20);
      if (this.playerHealth == 100) {
        this.warning = "HP has already maxed out!";
        setTimeout(() => {
          this.warning = "";
        }, 1500);
        return;
      }
      if (this.playerHealth + healValue > 100) {
        const savedPlayerHealth = this.playerHealth;
        this.playerHealth = 100;
        const realHealValue = healValue - (savedPlayerHealth + healValue - 100);
        this.addLogMessage("player", "heal", realHealValue);
      } else {
        this.playerHealth += healValue;
        this.addLogMessage("player", "heal", healValue);
      }
      this.healSomeone("player");
      this.monsterAttack();
    },
    sharedAttack(callback = false) {
      this.isAttacking = false;
      this.playerStandby = true;
      clearTimeout(() => {
        this.hideAttackBar();
        this.message = ["bad", "monster turn"];
      }, 1000);
      clearTimeout(this.indicatorTimer);
      clearInterval(this.attckRangeTimer);
      this.hitSomeone("monster");
      setTimeout(() => {
        if (callback) {
          this.roundToUseSpecialAttack = 5;
        }
        this.monsterAttack();
      }, 1000);
    },
    playerAttack() {
      this.sharedAttack();
      if (this.attckRange < 21) {
        this.monsterHealth -= 5;
        this.addLogMessage("player", "attack", 5);
      } else {
        const attackValue = Math.floor(this.attckRange / 4.16);
        this.monsterHealth -= attackValue;
        this.addLogMessage("player", "attack", attackValue);
      }
    },
    playerSpecialAttack() {
      this.sharedAttack(true);
      if (this.attckRange < 10) {
        this.monsterHealth -= 6;
        this.addLogMessage("player", "attack", 6);
      } else {
        const attackValue = Math.floor(this.attckRange / 1.875);
        this.monsterHealth -= attackValue;
        this.addLogMessage("player", "special-attack", attackValue);
      }
    },
    startAttacking() {
      this.isAttacking = true;
      this.attckRangeTimer = setInterval(() => {
        this.indicatorNum += 1;
        if (this.indicatorNum > 50) {
          this.attckRange--;
        } else {
          this.attckRange++;
        }
        this.indicator = `${this.indicatorNum}%`;
      }, 10);
      this.indicatorTimer = setTimeout(() => {
        clearInterval(this.attckRangeTimer);

        this.attckRangeTimer = setInterval(() => {
          if (this.indicatorNum > 50) {
            this.attckRange++;
          } else {
            this.attckRange--;
          }
          this.indicatorNum -= 1;
          this.indicator = `${this.indicatorNum}%`;
        }, 10);

        this.indicatorTimer = setTimeout(() => {
          clearInterval(this.attckRangeTimer);
          this.hideAttackBar();
          this.monsterAttack();
        }, 1000);
      }, 1000);
    },
    showAttackBar(attack) {
      this.isAttackBar = true;
      this.attackType = attack;
    },
    hideAttackBar() {
      clearTimeout(this.indicatorTimer);
      clearInterval(this.attckRangeTimer);
      this.indicator = 0;
      this.indicatorNum = 0;
      this.attckRange = 0;
      this.isAttacking = false;
      this.isAttackBar = false;
    },
    surrender() {
      this.endGame("monster");
    },
    addLogMessage(who, what, value) {
      this.logs.unshift({
        who,
        what,
        value,
      });
    },
  },
});

app.mount("#game");
