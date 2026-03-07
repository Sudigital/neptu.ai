// ============================================================================
// Personality (Sifat) Menurut Umur — Personality Traits by Age
// ============================================================================

/**
 * Personality trait entry with multi-language descriptions.
 * The watak number (1–12) is derived from total_urip modulo 12.
 * Ages repeat every 12 years in each group.
 */
interface WatakEntry {
  readonly watak: number;
  readonly ages: readonly number[];
  readonly descriptions: Readonly<Record<string, string>>;
}

/**
 * Number of watak groups in the cycle.
 */
const WATAK_CYCLE = 12;

/**
 * Maximum age boundary covered by the Personality table.
 */
const MAX_AGE = 108;

/**
 * Generate the repeating age array for a given watak number.
 * Ages follow a 12-year cycle: watak, watak+12, watak+24, ... up to MAX_AGE.
 */
function generateAges(watak: number): readonly number[] {
  const ages: number[] = [];
  for (let age = watak; age <= MAX_AGE; age += WATAK_CYCLE) {
    ages.push(age);
  }
  return ages;
}

/**
 * All 12 Personality entries.
 * Source: Traditional Balinese Primbon Wariga reference.
 */
export const PERSONALITY_TABLE: readonly WatakEntry[] = [
  {
    watak: 1,
    ages: generateAges(1),
    descriptions: {
      id: "Kemanja-manjaan, hati terasa terang, bermunculan firasat-firasat, kadang-kadang berlaku nekat, bahayanya kena fitnah.",
      en: "This person is pampering, has clear heart, intuitive, occasionally does anything no matter what would happen, he is also at risk of being slandered.",
      fr: "Cette personne est indulgente, a le cœur clair, intuitive, agit parfois sans réfléchir, et risque d'être calomniée.",
      de: "Diese Person ist verwöhnt, hat ein klares Herz, ist intuitiv, handelt manchmal rücksichtslos und läuft Gefahr, verleumdet zu werden.",
      es: "Esta persona es consentida, tiene el corazón claro, es intuitiva, a veces actúa sin pensar y corre riesgo de ser calumniada.",
      pt: "Esta pessoa é mimada, tem coração claro, é intuitiva, às vezes age impulsivamente e corre risco de ser caluniada.",
      ru: "Этот человек избалован, имеет чистое сердце, интуитивен, иногда действует безрассудно и рискует быть оклеветанным.",
      ja: "この人は甘やかされ、心が澄み、直感力があり、時に無謀に行動し、中傷されるリスクがある。",
      ko: "이 사람은 응석받이이며, 마음이 밝고, 직감이 있으며, 때때로 무모하게 행동하고, 비방당할 위험이 있다.",
      zh: "此人娇惯，心地明亮，直觉敏锐，偶尔鲁莽行事，有被诽谤的风险。",
    },
  },
  {
    watak: 2,
    ages: generateAges(2),
    descriptions: {
      id: "Keras hati, angkuh, ingin berkuasa, usahanya mendapat dukungan dari orang yang berpangkat, kariernya menanjak, namun mudah dimanfaatkan oleh orang dengan maksud tertentu. Patut waspada agar jangan menyesal dikemudian hari. Bersifat kuat. Bahayanya terhadap benda tajam.",
      en: "This person has strong determination, arrogant, is interested in power gain, his efforts enjoy support from important people. This person has good career but can easily be manipulated by others for specific purposes. This person needs to be careful to avoid regret in the future. Strong character. Avoid sharp objects.",
      fr: "Cette personne a une forte détermination, est arrogante, cherche le pouvoir. Ses efforts sont soutenus par des gens importants. Bonne carrière mais facilement manipulable. Doit être prudente pour éviter les regrets. Caractère fort. Attention aux objets tranchants.",
      de: "Diese Person ist willensstark, arrogant, strebt nach Macht. Ihre Bemühungen werden von wichtigen Leuten unterstützt. Gute Karriere, aber leicht manipulierbar. Sollte vorsichtig sein, um Reue zu vermeiden. Starker Charakter. Vorsicht vor scharfen Gegenständen.",
      es: "Esta persona tiene fuerte determinación, es arrogante y busca poder. Sus esfuerzos reciben apoyo de personas importantes. Buena carrera pero fácilmente manipulable. Debe ser cuidadosa para evitar arrepentimientos. Carácter fuerte. Cuidado con objetos afilados.",
      pt: "Esta pessoa tem forte determinação, é arrogante e busca poder. Seus esforços recebem apoio de pessoas importantes. Boa carreira mas facilmente manipulável. Deve ter cuidado para evitar arrependimentos. Caráter forte. Cuidado com objetos cortantes.",
      ru: "Этот человек волевой, высокомерный, стремится к власти. Его усилия поддерживаются влиятельными людьми. Хорошая карьера, но легко поддаётся манипуляциям. Должен быть осторожен, чтобы избежать сожалений. Сильный характер. Остерегайтесь острых предметов.",
      ja: "この人は意志が強く、傲慢で、権力を求める。重要な人物から支援を受ける。良い経歴だが操られやすい。後悔しないよう注意すべき。強い性格。鋭利な物に注意。",
      ko: "이 사람은 의지가 강하고, 오만하며, 권력을 추구한다. 중요한 인물들의 지지를 받는다. 좋은 경력이지만 쉽게 이용당한다. 후회하지 않도록 주의해야 한다. 강한 성격. 날카로운 물건 주의.",
      zh: "此人意志坚定，傲慢，追求权力。得到重要人物的支持。事业好但容易被人利用。应谨慎以避免将来后悔。性格刚强。注意锐利物品。",
    },
  },
  {
    watak: 3,
    ages: generateAges(3),
    descriptions: {
      id: "Mudah bingung, sukar berkonsentrasi. Terasa kehilangan gairah hidup. Kemauan kerja muncul bila sudah terdesak oleh keluarga, terutama kebutuhan ekonomi. Sering kena tipu. Mudah diserang sakit kepala, batuk-batuk dan sakit dada.",
      en: "This person is easily confused, difficult to concentrate and loses spirit. Willingness to work emerges due to family economic needs. Frequently cheated, easily suffers from headaches, coughs and chest pains.",
      fr: "Cette personne est facilement confuse, a du mal à se concentrer et perd sa motivation. La volonté de travailler apparaît sous pression économique familiale. Souvent trompée, sujette aux maux de tête, toux et douleurs thoraciques.",
      de: "Diese Person ist leicht verwirrt, hat Konzentrationsschwierigkeiten und verliert den Lebensmut. Arbeitsbereitschaft entsteht durch wirtschaftlichen Familiensdruck. Wird oft betrogen, anfällig für Kopfschmerzen, Husten und Brustschmerzen.",
      es: "Esta persona se confunde fácilmente, tiene dificultad para concentrarse y pierde motivación. La voluntad de trabajar surge por necesidades económicas familiares. Frecuentemente engañada, propensa a dolores de cabeza, tos y dolor de pecho.",
      pt: "Esta pessoa se confunde facilmente, tem dificuldade de concentração e perde motivação. A vontade de trabalhar surge por necessidades econômicas familiares. Frequentemente enganada, propensa a dores de cabeça, tosse e dores no peito.",
      ru: "Этот человек легко путается, с трудом концентрируется и теряет жизненный дух. Желание работать появляется из-за экономических потребностей семьи. Часто обманывают, подвержен головным болям, кашлю и болям в груди.",
      ja: "この人は混乱しやすく、集中が苦手で、活力を失いやすい。家族の経済的必要性から仕事への意欲が生まれる。よく騙され、頭痛、咳、胸の痛みを起こしやすい。",
      ko: "이 사람은 쉽게 혼란스러워하고, 집중력이 부족하며, 의욕을 잃는다. 가족의 경제적 필요로 인해 일할 의지가 생긴다. 자주 속으며, 두통, 기침, 흉통에 걸리기 쉽다.",
      zh: "此人容易困惑，难以集中注意力，失去生活热情。因家庭经济需要才产生工作意愿。经常被骗，容易头痛、咳嗽和胸痛。",
    },
  },
  {
    watak: 4,
    ages: generateAges(4),
    descriptions: {
      id: "Selalu waspada hemat, suka menabung. Nampak kikir dan rakus karena suka mengumpulkan uang (menabung) demi masa depannya serta keluarga. Mudah sakit pada pencernaan. Harus pandai mengikuti arus, situasi, bila tidak akan membahayakan.",
      en: "This person is always economical and likes saving. He looks stingy and greedy because he likes saving for his future and family. He can easily suffer from digestion problems. He should be careful in anticipating situations otherwise he could be in great danger.",
      fr: "Cette personne est toujours économe et aime épargner. Elle paraît avare car elle épargne pour son avenir et sa famille. Sujette aux problèmes digestifs. Doit bien anticiper les situations sinon elle risque de grands dangers.",
      de: "Diese Person ist stets sparsam und spart gerne. Wirkt geizig, weil sie für Zukunft und Familie spart. Anfällig für Verdauungsprobleme. Muss Situationen gut einschätzen, sonst droht Gefahr.",
      es: "Esta persona es siempre económica y le gusta ahorrar. Parece tacaña porque ahorra para su futuro y familia. Propensa a problemas digestivos. Debe anticipar bien las situaciones para evitar peligros.",
      pt: "Esta pessoa é sempre econômica e gosta de poupar. Parece avarenta porque poupa para seu futuro e família. Propensa a problemas digestivos. Deve antecipar bem as situações para evitar perigos.",
      ru: "Этот человек всегда экономен и любит копить. Выглядит скупым, потому что откладывает для будущего и семьи. Подвержен проблемам с пищеварением. Должен хорошо оценивать ситуации, иначе может оказаться в опасности.",
      ja: "この人は常に倹約家で貯蓄を好む。将来と家族のために貯蓄するのでケチに見える。消化器系の問題を起こしやすい。状況をよく見極めないと危険に陥る。",
      ko: "이 사람은 항상 절약하며 저축을 좋아한다. 미래와 가족을 위해 저축하므로 인색해 보인다. 소화기 질환에 걸리기 쉽다. 상황을 잘 판단하지 않으면 큰 위험에 처할 수 있다.",
      zh: "此人总是节俭，喜欢储蓄。因为为未来和家庭储蓄而显得吝啬。容易有消化问题。必须善于判断形势，否则可能面临危险。",
    },
  },
  {
    watak: 5,
    ages: generateAges(5),
    descriptions: {
      id: "Ramah, suka bergurau, percaya diri. Gampang mendapat kemudahan (fasilitas), keinginannya cepat terwujud, karena mudah pula menjadi tamak. Hendaknya hati-hati mengatur keuangan, sebab kemudahan itu tidak selalu ada. Waspadalah terhadap godaan pria / wanita, sebab akan ada godaan yang menghalang.",
      en: "Friendly, likes joking and self-confident. This person has easy access to facilities, and wishes can easily be realised making him greedy. Should be careful in managing money as such facilities are not always available. Should be careful with romantic temptations.",
      fr: "Amical, aime plaisanter et confiant. A facilement accès aux facilités, ses souhaits se réalisent vite, ce qui peut le rendre cupide. Doit gérer l'argent prudemment car ces facilités ne durent pas. Attention aux tentations romantiques.",
      de: "Freundlich, scherzt gerne und selbstbewusst. Hat leichten Zugang zu Möglichkeiten, Wünsche werden schnell wahr, was gierig machen kann. Sollte Geld sorgfältig verwalten, da diese Möglichkeiten nicht immer bestehen. Vorsicht vor romantischen Versuchungen.",
      es: "Amigable, le gusta bromear y es seguro de sí mismo. Tiene fácil acceso a facilidades, sus deseos se realizan rápido, lo que puede volverlo ambicioso. Debe manejar el dinero con cuidado. Cuidado con tentaciones románticas.",
      pt: "Amigável, gosta de brincar e é autoconfiante. Tem fácil acesso a facilidades, seus desejos se realizam rapidamente, podendo se tornar ganancioso. Deve gerenciar dinheiro com cuidado. Cuidado com tentações românticas.",
      ru: "Дружелюбный, любит шутить, уверен в себе. Легко получает возможности, желания быстро исполняются, что может сделать жадным. Следует осторожно управлять деньгами. Остерегайтесь романтических искушений.",
      ja: "友好的で冗談好き、自信がある。施設に恵まれ、願望がすぐ叶うので欲張りになりやすい。お金の管理に注意すべき。恋愛の誘惑に注意。",
      ko: "친절하고 농담을 좋아하며 자신감이 있다. 시설에 쉽게 접근하고 소원이 빨리 이루어져 탐욕스러워질 수 있다. 돈 관리에 주의해야 한다. 이성의 유혹에 주의.",
      zh: "友善，爱开玩笑，自信。容易获得便利，愿望容易实现，因此可能变得贪婪。应谨慎理财。警惕感情诱惑。",
    },
  },
  {
    watak: 6,
    ages: generateAges(6),
    descriptions: {
      id: "Suka mencampuri urusan orang lain, sombong. Tidak menyadari perubahan usia, sehingga dia merasa seperti yang dulu. Mudah terserang penyakit mata, mudah terganggu godaan sexual. Hati-hati terhadap musuh dalam selimut, sering menerima surat kaleng.",
      en: "This person is arrogant and likes interfering with other people's business. Does not realise his age status. Can easily suffer from eye problems, or sexual seduction which is very close to this person.",
      fr: "Cette personne est arrogante et aime se mêler des affaires des autres. Ne réalise pas son âge. Sujette aux problèmes oculaires et aux séductions. Attention aux ennemis cachés.",
      de: "Diese Person ist arrogant und mischt sich gerne in fremde Angelegenheiten. Erkennt ihr Alter nicht. Anfällig für Augenprobleme und Verführungen. Vorsicht vor versteckten Feinden.",
      es: "Esta persona es arrogante y le gusta meterse en asuntos ajenos. No se da cuenta de su edad. Propensa a problemas oculares y a seducciones. Cuidado con enemigos ocultos.",
      pt: "Esta pessoa é arrogante e gosta de se meter nos assuntos alheios. Não percebe sua idade. Propensa a problemas oculares e a seduções. Cuidado com inimigos ocultos.",
      ru: "Этот человек высокомерен и любит вмешиваться в чужие дела. Не осознаёт свой возраст. Подвержен проблемам со зрением и соблазнам. Остерегайтесь скрытых врагов.",
      ja: "この人は傲慢で他人の問題に干渉する。年齢を自覚しない。目の病気や誘惑に弱い。隠れた敵に注意。",
      ko: "이 사람은 오만하고 남의 일에 간섭하기를 좋아한다. 자신의 나이를 인식하지 못한다. 눈 질환과 유혹에 약하다. 숨겨진 적에 주의.",
      zh: "此人傲慢，喜欢干涉他人事务。不认识自己的年龄。容易有眼疾和被诱惑。注意暗中的敌人。",
    },
  },
  {
    watak: 7,
    ages: generateAges(7),
    descriptions: {
      id: "Pada jenjang ini rasa cemburu bermunculan, ia peramah, disukai orang. Dekat dengan atasannya. Mudah naik pangkat, bila berwiraswasta banyak relasinya. Bertanggung jawab terhadap tugas dan kewajibannya. Kesehatan cukup baik, hati-hati bila memanjat pohon.",
      en: "At this stage this person is very jealous but friendly and well liked by others. Close to superiors and will have a lot of contacts in business. Responsible for assigned duties. Good health condition, but should be careful when climbing.",
      fr: "À ce stade, cette personne est jalouse mais amicale et appréciée. Proche de ses supérieurs, a beaucoup de contacts en affaires. Responsable dans ses devoirs. Bonne santé, mais prudence en escalade.",
      de: "In dieser Phase ist die Person eifersüchtig, aber freundlich und beliebt. Nah an Vorgesetzten, hat viele Geschäftskontakte. Verantwortungsbewusst. Gute Gesundheit, aber Vorsicht beim Klettern.",
      es: "En esta etapa la persona es celosa pero amigable y querida. Cercana a superiores, tiene muchos contactos de negocios. Responsable con sus deberes. Buena salud, pero cuidado al escalar.",
      pt: "Nesta fase a pessoa é ciumenta mas amigável e querida. Próxima de superiores, tem muitos contatos de negócios. Responsável com deveres. Boa saúde, mas cuidado ao escalar.",
      ru: "На этом этапе человек ревнив, но дружелюбен и любим другими. Близок к начальству, имеет много деловых контактов. Ответственный. Хорошее здоровье, но осторожность при подъёме на высоту.",
      ja: "この段階では嫉妬心があるが、友好的で好かれる。上司に近く、ビジネスでの人脈が広い。責任感がある。健康状態は良好だが、高所に注意。",
      ko: "이 단계에서는 질투심이 있지만 친절하고 사랑받는다. 상사와 가깝고 사업 인맥이 넓다. 책임감이 있다. 건강은 양호하지만 높은 곳에 주의.",
      zh: "此阶段此人嫉妒但友善，受人喜爱。与上司关系好，生意人脉广。责任心强。健康良好，但注意高处安全。",
    },
  },
  {
    watak: 8,
    ages: generateAges(8),
    descriptions: {
      id: "Suka menyendiri, kata-katanya lembut menyejukkan hati, teguh pendirian, walaupun dirundung kesedihan. Rejekinya banyak tapi lekas habis karena ia pemurah hati / suka menolong orang. Ia harus berusaha keras untuk menutupi biaya-biaya hidupnya, sering pindah tempat karena gangguan-gangguan yang muncul. Jaga kesehatan paru-paru. Untuk mengatasi keresahan hati, hendaknya ingat melakukan sembahyang leluhur.",
      en: "This person likes being alone, his voice is tender and soft. Persistent in spite of all sorrows. Can easily obtain luck but spends money easily because he likes helping people. Should work hard to cover expenses and moves frequently due to problems. Take care of lung health. Pray for ancestors to find peace.",
      fr: "Cette personne aime la solitude, sa voix est douce et apaisante. Persévérante malgré les chagrins. A de la chance mais dépense facilement en aidant les autres. Doit travailler dur pour couvrir les dépenses, déménage souvent. Prendre soin des poumons. Prier les ancêtres pour la paix.",
      de: "Diese Person ist gerne allein, ihre Stimme ist sanft und beruhigend. Beharrlich trotz Sorgen. Hat Glück, gibt aber leicht Geld aus, weil sie gerne hilft. Muss hart arbeiten für Ausgaben, zieht oft um. Lungengesundheit beachten. Ahnen für Frieden anrufen.",
      es: "A esta persona le gusta estar sola, su voz es suave y reconfortante. Persistente a pesar de las penas. Tiene suerte pero gasta fácilmente al ayudar a otros. Debe trabajar duro para cubrir gastos, se muda a menudo. Cuidar los pulmones. Orar a los ancestros para encontrar paz.",
      pt: "Esta pessoa gosta de ficar sozinha, sua voz é suave e reconfortante. Persistente apesar das tristezas. Tem sorte mas gasta facilmente ajudando outros. Deve trabalhar duro para cobrir despesas, muda-se frequentemente. Cuidar dos pulmões. Rezar aos ancestrais para encontrar paz.",
      ru: "Этот человек любит быть один, голос нежный и успокаивающий. Настойчив несмотря на горести. Легко получает удачу, но быстро тратит, помогая другим. Должен усердно работать для покрытия расходов, часто переезжает. Берегите лёгкие. Молитесь предкам для обретения покоя.",
      ja: "この人は一人を好み、声は柔らかく心を癒す。悲しみにも関わらず粘り強い。運に恵まれるが、人助けでお金をすぐ使ってしまう。生活費のために懸命に働くべき。頻繁に引っ越す。肺の健康に注意。祖先への祈りで心の平安を。",
      ko: "이 사람은 혼자 있기를 좋아하고, 목소리가 부드럽고 따뜻하다. 슬픔에도 불구하고 끈기 있다. 운이 좋지만 남을 도우며 쉽게 돈을 쓴다. 생활비를 위해 열심히 일해야 하며, 자주 이사한다. 폐 건강에 주의. 조상에게 기도하여 평화를 찾으라.",
      zh: "此人喜欢独处，声音温柔抚慰人心。尽管遭遇悲伤仍然坚持不懈。容易获得好运但因喜欢帮助他人而花钱快。应努力工作覆盖开支，经常搬家。注意肺部健康。祈祷祖先以获得平静。",
    },
  },
  {
    watak: 9,
    ages: generateAges(9),
    descriptions: {
      id: "Muncul keragu-raguan, namun kalau terpaksa bisa jadi nekat, suka keluar rumah, untuk mencari informasi, demi kesejahteraan bawahannya maupun keluarga, sering berpergian dan membawa keberhasilan, namun godaan-godaan selalu menghadangnya. Jangan kerja jadi pengemudi, sebab watak ragu-ragu akan membahayakannya. Kesehatan terganggu karena pusing, penyakit perut dan penyakit dalam berpergian.",
      en: "This person is doubtful but could also act in a determined way if he has to. Enjoys going out for information for family welfare. Frequently travels and comes back with success but also faces hindrances. Should not work as a driver. Health problems include headaches, stomachache and travel-related illness.",
      fr: "Cette personne est hésitante mais peut agir avec détermination si nécessaire. Aime sortir pour trouver des informations pour la famille. Voyage souvent avec succès mais fait face à des obstacles. Ne devrait pas être chauffeur. Problèmes de santé : maux de tête, estomac et maladies de voyage.",
      de: "Diese Person ist zweifelnd, kann aber entschlossen handeln wenn nötig. Geht gerne für Familieninfos aus. Reist oft mit Erfolg, steht aber vor Hindernissen. Sollte nicht Fahrer werden. Gesundheit: Kopfschmerzen, Magenprobleme und Reisekrankheiten.",
      es: "Esta persona es dudosa pero puede actuar con determinación si es necesario. Le gusta salir para buscar información para la familia. Viaja frecuentemente con éxito pero enfrenta obstáculos. No debería trabajar como conductor. Problemas de salud: dolores de cabeza, estómago y enfermedades de viaje.",
      pt: "Esta pessoa é hesitante mas pode agir com determinação se necessário. Gosta de sair para buscar informações para a família. Viaja frequentemente com sucesso mas enfrenta obstáculos. Não deveria trabalhar como motorista. Problemas de saúde: dores de cabeça, estômago e doenças de viagem.",
      ru: "Этот человек сомневающийся, но может действовать решительно при необходимости. Любит выходить за информацией для семьи. Часто путешествует успешно, но сталкивается с препятствиями. Не следует работать водителем. Проблемы со здоровьем: головные боли, желудок и дорожные болезни.",
      ja: "この人は疑い深いが、必要なら断固として行動できる。家族の福祉のために情報を求めて外出する。よく旅行して成功するが、障害にも直面する。運転手になるべきではない。健康問題：頭痛、胃痛、旅行関連の病気。",
      ko: "이 사람은 의심이 많지만 필요하면 단호하게 행동할 수 있다. 가족의 복지를 위해 정보를 찾으러 나가는 것을 좋아한다. 자주 여행하며 성공하지만 장애물도 만난다. 운전기사로 일하면 안 된다. 건강 문제: 두통, 위장병, 여행 관련 질병.",
      zh: "此人犹豫不决，但必要时能果断行动。喜欢外出为家人寻找信息。经常旅行且有所成就，但也面临阻碍。不应当司机。健康问题：头痛、胃病和旅途疾病。",
    },
  },
  {
    watak: 10,
    ages: generateAges(10),
    descriptions: {
      id: "Bijaksana, ilmuan, berarti utama. Tidak suka terkekang, tidak mudah didikte. Usahanya demi cita-cita akan terwujud, namun ia nampak kurang teganya bila terikat kepada keluarganya. Kesehatan jaga penyakit jantung, paru-paru. Jangan ingkar janji membahayakan.",
      en: "Wise and values knowledge and science. Likes freedom and cannot be dictated. Efforts for aspirations will be realised but does not enjoy being detached from family. Should be careful with heart and lung problems. Must keep promises, as breaking them could be dangerous.",
      fr: "Sage et valorise la connaissance et la science. Aime la liberté et ne peut être dicté. Ses efforts pour ses aspirations seront réalisés mais n'aime pas être détaché de la famille. Attention au cœur et aux poumons. Doit tenir ses promesses, les rompre est dangereux.",
      de: "Weise und schätzt Wissen und Wissenschaft. Liebt Freiheit und lässt sich nicht vorschreiben. Bestrebungen werden verwirklicht, mag aber nicht von Familie getrennt sein. Vorsicht bei Herz- und Lungenproblemen. Versprechen halten, Bruch kann gefährlich sein.",
      es: "Sabio y valora el conocimiento y la ciencia. Ama la libertad y no puede ser dictada. Sus aspiraciones se realizarán pero no disfruta estar separado de la familia. Cuidado con problemas cardíacos y pulmonares. Debe cumplir promesas, romperlas es peligroso.",
      pt: "Sábio e valoriza o conhecimento e a ciência. Ama a liberdade e não pode ser ditado. Suas aspirações serão realizadas mas não gosta de ficar afastado da família. Cuidado com problemas cardíacos e pulmonares. Deve cumprir promessas, quebrá-las é perigoso.",
      ru: "Мудрый, ценит знания и науку. Любит свободу и не терпит диктата. Стремления будут реализованы, но не любит быть оторванным от семьи. Остерегайтесь проблем с сердцем и лёгкими. Нужно держать обещания — нарушение опасно.",
      ja: "賢く、知識と科学を重視する。自由を愛し、指図されるのを嫌う。志は実現するが、家族から離れるのは好まない。心臓と肺の問題に注意。約束は守るべき、破ると危険。",
      ko: "현명하고 지식과 과학을 중시한다. 자유를 사랑하며 지시받는 것을 싫어한다. 열망은 실현되지만 가족과 떨어지는 것을 좋아하지 않는다. 심장과 폐 질환에 주의. 약속을 지켜야 하며, 어기면 위험하다.",
      zh: "明智，重视知识和科学。热爱自由，不能被支配。志向将会实现，但不喜欢与家人分离。注意心脏和肺部疾病。必须信守承诺，违背可能带来危险。",
    },
  },
  {
    watak: 11,
    ages: generateAges(WATAK_CYCLE - 1),
    descriptions: {
      id: "Tenang, namun penuh disiplin. Bersikap pasif, senang dirumah, rejekinya pas-pasan namun tetap merasa puas. Mudah diserang penyakit rematik. Orang iri hati bila ia berhasil bahkan dimusuhi, namun dapat menyelamatkan diri.",
      en: "Calm but well disciplined, passive and enjoys staying at home. Happy although what he has is just enough. Should be careful with rheumatism. People might be jealous of his success, but he will survive.",
      fr: "Calme mais bien discipliné, passif et aime rester à la maison. Heureux même si ses moyens sont justes. Attention aux rhumatismes. Les gens peuvent être jaloux de son succès, mais il survivra.",
      de: "Ruhig aber diszipliniert, passiv und bleibt gerne zu Hause. Zufrieden obwohl seine Mittel knapp sind. Vorsicht vor Rheuma. Andere können neidisch auf seinen Erfolg sein, aber er wird überleben.",
      es: "Tranquilo pero bien disciplinado, pasivo y disfruta estar en casa. Feliz aunque lo que tiene es justo. Cuidado con el reumatismo. La gente puede estar celosa de su éxito, pero sobrevivirá.",
      pt: "Calmo mas bem disciplinado, passivo e gosta de ficar em casa. Feliz mesmo com recursos limitados. Cuidado com reumatismo. As pessoas podem ter inveja de seu sucesso, mas ele sobreviverá.",
      ru: "Спокойный, но дисциплинированный, пассивный, любит быть дома. Доволен, хотя средств едва хватает. Остерегайтесь ревматизма. Люди могут завидовать его успеху, но он выживет.",
      ja: "落ち着いているが規律正しい。受動的で家にいることを好む。十分でなくても満足する。リウマチに注意。人々は成功を妬むかもしれないが、乗り越えられる。",
      ko: "차분하지만 규율이 잘 잡혀 있고, 수동적이며 집에 있기를 좋아한다. 겨우 충분하지만 만족한다. 류머티즘에 주의. 사람들이 성공을 질투할 수 있지만 살아남을 것이다.",
      zh: "沉稳但纪律严明，被动，喜欢待在家里。虽然收入刚好够用但仍感满足。注意风湿病。别人可能嫉妒其成功，但能够自保。",
    },
  },
  {
    watak: 12,
    ages: generateAges(WATAK_CYCLE),
    descriptions: {
      id: "Cemburu, keras hati tetapi welas asih dan sosial, berdisiplin. Pada usia ini bagaikan berada dipersimpangan jalan. Harus waspada untuk menentukan langkah yang tepat dan bijaksana adalah pasrah kepada Tuhan Yang Maha Esa. Bila salah pilih anda bisa terjerumus oleh rayuan, hawa nafsu dan bisa dipengaruhi oleh roh-roh jahat. Iblis suka merayu dan menjanjikan kesenangan duniawi, yang semu sifatnya, inilah yang membawa kejalan yang sesat.",
      en: "Jealous, self-determined but kind hearted and self-disciplined. At this age it is like going into an intersection. Should be careful in making decisions. The wise decision would be surrender to the supreme being. If a wrong choice is made, one could be influenced by bad spirits or controlled by ego.",
      fr: "Jaloux, déterminé mais au bon cœur et discipliné. À cet âge, c'est comme être à un carrefour. Doit être prudent dans ses décisions. La sagesse est de s'en remettre à l'Être suprême. Un mauvais choix peut mener sous l'influence de mauvais esprits.",
      de: "Eifersüchtig, willensstark aber gutherzig und diszipliniert. In diesem Alter steht man an einer Kreuzung. Muss bei Entscheidungen vorsichtig sein. Die weise Entscheidung ist die Hingabe an das höchste Wesen. Eine falsche Wahl kann zu schlechten Einflüssen führen.",
      es: "Celoso, determinado pero de buen corazón y disciplinado. A esta edad es como estar en una encrucijada. Debe ser cuidadoso al tomar decisiones. La sabiduría es rendirse al Ser Supremo. Una mala elección puede llevar a influencias negativas.",
      pt: "Ciumento, determinado mas de bom coração e disciplinado. Nesta idade é como estar numa encruzilhada. Deve ser cuidadoso nas decisões. A sabedoria é entregar-se ao Ser Supremo. Uma escolha errada pode levar a influências negativas.",
      ru: "Ревнивый, волевой, но добросердечный и дисциплинированный. В этом возрасте — как на перекрёстке. Должен быть осторожен в решениях. Мудрое решение — довериться Высшему Существу. Неправильный выбор может привести под влияние злых духов.",
      ja: "嫉妬深いが、親切で自制心がある。この年齢は十字路に立つようなもの。決断には慎重であるべき。賢い決断は至高の存在に委ねること。間違った選択は悪い影響を受ける恐れがある。",
      ko: "질투심이 있지만 마음이 따뜻하고 자기 규율이 있다. 이 나이에는 교차로에 서 있는 것과 같다. 결정에 신중해야 한다. 현명한 결정은 최고의 존재에게 맡기는 것이다. 잘못된 선택은 나쁜 영향을 받을 수 있다.",
      zh: "嫉妒，意志坚定但心地善良且自律。在这个年龄就像站在十字路口。做决定时应谨慎。明智的决定是交托给至高无上的存在。错误的选择可能受到不良影响。",
    },
  },
];

/**
 * Get the Personality personality entry for a given total_urip.
 * The watak number is (total_urip % 12), mapped to 1–12 (0 maps to 12).
 */
export function getPersonality(totalUrip: number): WatakEntry | null {
  const mod = totalUrip % WATAK_CYCLE;
  const watakNum = mod === 0 ? WATAK_CYCLE : mod;
  return PERSONALITY_TABLE.find((w) => w.watak === watakNum) ?? null;
}

/**
 * Get the specific Personality personality entry for a given total_urip
 * and current age. Returns the watak entry with the matching age context,
 * or null if not found.
 */
export function getPersonalityForAge(
  totalUrip: number,
  age: number
): { watak: WatakEntry; currentAgeGroup: number } | null {
  const entry = getPersonality(totalUrip);
  if (!entry) return null;

  // Find the closest age group the person falls into (12-year cycle)
  const mod = age % WATAK_CYCLE;
  const currentAgeGroup = mod === 0 ? WATAK_CYCLE : mod;

  return { watak: entry, currentAgeGroup };
}
