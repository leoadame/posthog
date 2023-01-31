# Generated by Django 3.2.16 on 2023-01-31 17:01

import django.contrib.postgres.constraints
import django.db.models.expressions
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("posthog", "0295_plugin_allow_blank_config_schema"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="personoverride",
            constraint=models.CheckConstraint(
                check=models.Q(
                    ("old_person_id__eq", django.db.models.expressions.F("override_person_id")), _negated=True
                ),
                name="old_person_id_different_from_override_person_id",
            ),
        ),
        migrations.AddConstraint(
            model_name="personoverride",
            constraint=django.contrib.postgres.constraints.ExclusionConstraint(
                expressions=[
                    (django.db.models.expressions.F("array[old_person_id, override_person_id]"), "&&"),
                    ("override_person_id", "<>"),
                ],
                name="exclude_override_person_id_from_being_old_person_id",
            ),
        ),
    ]
