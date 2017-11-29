const key = "SuperKey";
let app;

window.onload = function () {
    app = new Vue({
        el: '#app',
        data: {
            authorized: false,
            loading: false,
            organizations: {}
        },
        methods: {
            getOrganizations() {
                this.loading = true;
                Trello.get("/members/me/organizations", (data) => {
                    this.loading = false;
                    this.organizations = data;
                }, () => {
                    alert("Ошибка при загрузке списка организаций");
                });
            },
            changeImage(organization) {
                let fileDialog = $("#file-dialog");
                fileDialog.click();

                $("#file-dialog").change(() => {
                    let fileName = $("#file-dialog").prop("files")[0];

                    var data = new FormData();
                    data.append("file", fileName);

                    this.loading = true;
                    $.ajax({
                        url: `https://api.trello.com/1/organizations/${organization.id}/logo?key=${Trello.key()}&token=${Trello.token()}`,
                        data: data,
                        processData: false,
                        contentType: false,
                        type: 'POST',
                        success: () => {
                            this.loading = false;
                            this.getOrganizations();
                        },
                        error: () => {
                            alert("Ошибка при загрузке логотипа организации!");
                            this.loading = false;
                        }
                    });
                });
            },
            changeOrganizationName(organization) {
                let newValue = prompt('Введите новое название организации:', organization.displayName);
                if (newValue !== null) {
                    this.loading = true;
                    organization.displayName = newValue;
                    Trello.put(`/organizations/${organization.id}`, organization, () => {
                        this.loading = false;
                    }, () => {
                        alert("Ошибка при изменении названия организации!");
                        this.loading = false;
                    });
                }
            },
            changeOrganizationDescription(organization) {
                let newValue = prompt('Введите новое описание организации:', organization.desc);
                if (newValue !== null) {
                    this.loading = true;
                    organization.desc = newValue;
                    Trello.put(`/organizations/${organization.id}`, organization, () => {
                        this.loading = false;
                    }, () => {
                        alert("Ошибка при изменении описания организации!");
                        this.loading = false;
                    });
                }
            },
            removeOrganization(organization) {
                this.loading = true;
                Trello.del(`/organizations/${organization.id}`, () => {
                    this.loading = false;
                    this.getOrganizations();
                }, () => {
                    alert("Ошибка при удалении организации!");
                    this.loading = false;
                });
            },
            createOrganization() {
                let newValue = prompt('Введите название организации:');
                if (newValue !== null) {
                    this.loading = true;
                    Trello.post("/organizations/", {
                        "displayName": newValue
                    }, () => {
                        this.loading = false;
                        this.getOrganizations();
                    }, () => {
                        alert("Ошибка при создании организации!");
                        this.loading = false;
                    });
                }
            }
        }
    });

    TryAunthorizeFromLocalStorage();
}

function TryAunthorizeFromLocalStorage()
{
    let localStorageEncryptedToken = localStorage.getItem("token");
    if (localStorageEncryptedToken !== null) {
        let bytes = CryptoJS.AES.decrypt(localStorageEncryptedToken, key);
        var encryptedToken = bytes.toString(CryptoJS.enc.Utf8);

        Trello.setToken(encryptedToken);
        Authorized();
    }
}

function StartAuthorization()
{
    Trello.authorize({
        type: "popup",
        name: "Первая лабораторная работа",
        expiration: "never",
        scope: {
            read: true,
            write: true,
            account: true
        },
        persist: false,
        success: Authorized,
        error: function() {
            alert("Проблема с авторизацией!");
            this.authorized = false;
        }
    });
}

function Authorized() {
    app.authorized = true;
    app.getOrganizations();

    let encryptedToken = CryptoJS.AES.encrypt(Trello.token(), key);
    localStorage.setItem("token", encryptedToken);
}
